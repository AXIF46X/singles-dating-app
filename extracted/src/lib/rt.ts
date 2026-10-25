import "server-only";
import { asc, desc, eq, and, or } from "drizzle-orm";
import { db } from "@/db";
import {
  chatSessions,
  matches,
  messages,
  profiles,
  sessionInteractions,
  sessionMessages,
  users,
} from "@/db/schema";

const uuidv4 = () => crypto.randomUUID();

type Decision = "pending" | "liked" | "passed";

export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  at: number;
};

type InMemorySession = {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: number;
  messages: ChatMessage[];
  aDecision: Decision;
  bDecision: Decision;
  bIsDemo: boolean;
};

declare global {
  var __singlesRt:
    | {
        online: Map<string, number>;
        waitingQueue: string[];
        activeSessions: Map<string, InMemorySession>;
        userToSession: Map<string, string>;
        subscribers: Map<string, Set<(payload: any) => void>>;
      }
    | undefined;
}

function getStore() {
  if (!global.__singlesRt) {
    global.__singlesRt = {
      online: new Map(),
      waitingQueue: [],
      activeSessions: new Map(),
      userToSession: new Map(),
      subscribers: new Map(),
    };
  }
  return global.__singlesRt;
}

/* ---------- presence + events ---------- */

export function addOnline(userId: string) {
  const store = getStore();
  store.online.set(userId, (store.online.get(userId) ?? 0) + 1);
}

export function removeOnline(userId: string) {
  const store = getStore();
  const count = (store.online.get(userId) ?? 0) - 1;
  if (count <= 0) {
    store.online.delete(userId);
    store.waitingQueue = store.waitingQueue.filter((id) => id !== userId);
  } else {
    store.online.set(userId, count);
  }
}

export function subscribe(userId: string, callback: (payload: any) => void) {
  const store = getStore();
  if (!store.subscribers.has(userId)) {
    store.subscribers.set(userId, new Set());
  }
  store.subscribers.get(userId)!.add(callback);
  return () => store.subscribers.get(userId)?.delete(callback);
}

export function publish(userId: string, payload: any) {
  const callbacks = getStore().subscribers.get(userId);
  if (!callbacks) return;
  for (const cb of callbacks) {
    try {
      cb(payload);
    } catch {
      // ignore broken pipes
    }
  }
}

/* ---------- demo partner selection ---------- */

async function getRecentTargetIds(userId: string) {
  const rows = await db
    .select({ targetId: sessionInteractions.targetId })
    .from(sessionInteractions)
    .where(eq(sessionInteractions.userId, userId))
    .orderBy(desc(sessionInteractions.createdAt))
    .limit(40);
  return rows.map((row) => row.targetId);
}

async function pickDemoPartner(userId: string) {
  const recentIds = await getRecentTargetIds(userId);
  const demoRows = await db
    .select({ userId: users.id })
    .from(users)
    .where(eq(users.isDemo, true));
  const demoIds = demoRows.map((row) => row.userId).filter((id) => id !== userId && !recentIds.includes(id));
  const pool = demoIds.length > 0 ? demoIds : demoRows.map((row) => row.userId).filter((id) => id !== userId);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ---------- session creation / recovery ---------- */

const DEMO_GREETINGS = [
  "Hey! Nice to meet you 😊",
  "Hi there! How's your day going?",
  "Hello! What brings you on here today?",
  "Hey! This is fun 😄",
  "Hi! Love meeting new people here.",
];

function cacheSession(session: InMemorySession) {
  const store = getStore();
  store.activeSessions.set(session.id, session);
  store.userToSession.set(session.userAId, session.id);
  if (!session.bIsDemo && session.userBId !== session.userAId) {
    store.userToSession.set(session.userBId, session.id);
  }
}

async function createSessionRecord(aId: string, bId: string, bIsDemo: boolean) {
  const session: InMemorySession = {
    id: uuidv4(),
    userAId: aId,
    userBId: bId,
    createdAt: Date.now(),
    messages: [],
    aDecision: "pending",
    bDecision: bIsDemo ? "liked" : "pending",
    bIsDemo,
  };

  cacheSession(session);
  await db.insert(chatSessions).values({ id: session.id, userAId: aId, userBId: bId, status: "active" });

  if (bIsDemo) {
    const line = DEMO_GREETINGS[Math.floor(Math.random() * DEMO_GREETINGS.length)];
    setTimeout(() => {
      void pushMessage(session.id, bId, line).catch(() => {});
    }, 900);
  }

  return session;
}

/** Rebuild an in-memory session from the database after a restart / cold process. */
async function recoverSessionFromDb(userId: string): Promise<InMemorySession | null> {
  const rows = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.status, "active"),
        or(eq(chatSessions.userAId, userId), eq(chatSessions.userBId, userId)),
      ),
    )
    .orderBy(desc(chatSessions.createdAt))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const partnerId = row.userAId === userId ? row.userBId : row.userAId;

  const partnerRows = await db
    .select({ isDemo: users.isDemo })
    .from(users)
    .where(eq(users.id, partnerId))
    .limit(1);
  const partnerIsDemo = partnerRows[0]?.isDemo ?? false;

  const msgRows = await db
    .select()
    .from(sessionMessages)
    .where(eq(sessionMessages.sessionId, row.id))
    .orderBy(asc(sessionMessages.createdAt));

  const interactionRows = await db
    .select()
    .from(sessionInteractions)
    .where(eq(sessionInteractions.sessionId, row.id));

  const decisionFor = (uid: string): Decision => {
    const found = interactionRows.find((i) => i.userId === uid);
    return (found?.decision as "liked" | "passed") ?? "pending";
  };

  const bIsDemo = partnerIsDemo && row.userBId === partnerId;

  const session: InMemorySession = {
    id: row.id,
    userAId: row.userAId,
    userBId: row.userBId,
    createdAt: new Date(row.createdAt).getTime(),
    messages: msgRows.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      text: m.content,
      at: new Date(m.createdAt).getTime(),
    })),
    aDecision: decisionFor(row.userAId),
    bDecision: bIsDemo && decisionFor(row.userBId) === "pending" ? "liked" : decisionFor(row.userBId),
    bIsDemo,
    };

  cacheSession(session);
  return session;
}

/* ---------- public session API ---------- */

export function getActiveSessionForUser(userId: string) {
  const store = getStore();
  const id = store.userToSession.get(userId);
  if (!id) return null;
  return store.activeSessions.get(id) ?? null;
}

export async function startSession(userId: string) {
  const store = getStore();

  // 1) resume in-memory session
  const existing = getActiveSessionForUser(userId);
  if (existing) return existing;

  // 2) recover from database (server restarted, or another page)
  const recovered = await recoverSessionFromDb(userId);
  if (recovered) return recovered;

  // 3) try a real waiting partner
  store.waitingQueue = store.waitingQueue.filter((id) => id !== userId);
  const partnerId = store.waitingQueue.shift();
  if (partnerId && partnerId !== userId) {
    return createSessionRecord(userId, partnerId, false);
  }

  // 4) fall back to a demo partner
  const demoId = await pickDemoPartner(userId);
  if (demoId) {
    return createSessionRecord(userId, demoId, true);
  }

  // 5) no one available -> queue this user until someone shows up (in-memory only)
  store.waitingQueue.push(userId);
  const session: InMemorySession = {
    id: uuidv4(),
    userAId: userId,
    userBId: userId,
    createdAt: Date.now(),
    messages: [],
    aDecision: "pending",
    bDecision: "pending",
    bIsDemo: false,
  };
  cacheSession(session);
  return session;
}

export async function endSession(userId: string) {
  const store = getStore();
  const sessionId = store.userToSession.get(userId);
  if (!sessionId) return;
  const session = store.activeSessions.get(sessionId);
  if (!session) {
    store.userToSession.delete(userId);
    return;
  }
  const partnerId = session.userAId === userId ? session.userBId : session.userAId;

  store.userToSession.delete(userId);
  if (!session.bIsDemo && partnerId !== userId) {
    store.userToSession.delete(partnerId);
  }

  store.activeSessions.delete(sessionId);

  if (partnerId !== userId) {
    await db
      .update(chatSessions)
      .set({ status: "ended", endedAt: new Date() })
      .where(eq(chatSessions.id, sessionId))
      .catch(() => {});
  }

  // notify the real partner, drop them back into the queue
  if (!session.bIsDemo && partnerId !== userId) {
    if (!store.waitingQueue.includes(partnerId)) store.waitingQueue.push(partnerId);
    publish(partnerId, { type: "partner_left" });
  }
}

export async function nextPartner(userId: string) {
  await endSession(userId);
  return startSession(userId);
}

/* ---------- messages (persisted) ---------- */

export async function pushMessage(sessionId: string, senderId: string, text: string): Promise<ChatMessage> {
  const store = getStore();
  const session = store.activeSessions.get(sessionId);
  const message: ChatMessage = { id: uuidv4(), senderId, text, at: Date.now() };
  if (session) session.messages.push(message);

  await db
    .insert(sessionMessages)
    .values({ id: message.id, sessionId, senderId, content: text, createdAt: new Date(message.at) })
    .catch(() => {});

  // deliver to the partner over SSE (sender receives via HTTP response)
  if (session && session.userBId !== session.userAId) {
    const partnerId = session.userAId === senderId ? session.userBId : session.userAId;
    publish(partnerId, { type: "chat", sessionId, message });
  }

  return message;
}

/* ---------- decisions + matching ---------- */

const MATCH_MESSAGES = [
  "It's a match! So happy we connected 💕",
  "We matched! Can't wait to keep talking 😊",
  "Yay, it's a match! Say hi whenever you're free ✨",
];

export async function setDecision(userId: string, decision: "liked" | "passed") {
  const store = getStore();
  const session = getActiveSessionForUser(userId);
  if (!session) return { matched: false, matchId: null as string | null };

  const isA = session.userAId === userId;
  if (isA) session.aDecision = decision;
  else session.bDecision = decision;

  const targetId = isA ? session.userBId : session.userAId;

  await db
    .insert(sessionInteractions)
    .values({ sessionId: session.id, userId, targetId, decision })
    .onConflictDoNothing({ target: [sessionInteractions.sessionId, sessionInteractions.userId] });

  let matched = false;
  let matchId: string | null = null;

  if (session.aDecision === "liked" && session.bDecision === "liked" && session.userAId !== session.userBId) {
    const [match] = await db
      .insert(matches)
      .values({ userAId: session.userAId, userBId: session.userBId, sessionId: session.id })
      .onConflictDoNothing({ target: [matches.userAId, matches.userBId] })
      .returning({ id: matches.id });

    matchId = match?.id ?? null;
    if (!matchId) {
      const existing = await db
        .select({ id: matches.id })
        .from(matches)
        .where(and(eq(matches.userAId, session.userAId), eq(matches.userBId, session.userBId)))
        .limit(1);
      matchId = existing[0]?.id ?? null;
    }

    if (matchId) {
      matched = true;
      // demo partners send a sweet follow-up in the match thread
      if (session.bIsDemo) {
        const text = MATCH_MESSAGES[Math.floor(Math.random() * MATCH_MESSAGES.length)];
        await db
          .insert(messages)
          .values({ matchId, senderId: targetId, content: text })
          .catch(() => {});
      }
    }
  }

  const result = { matched, matchId, partnerId: targetId, sessionId: session.id };
  publish(session.userAId, { type: "decision", ...result });
  if (session.userBId !== session.userAId) {
    publish(session.userBId, { type: "decision", ...result });
  }

  return result;
}

/* ---------- hydration snapshot for the client ---------- */

export async function getStateSnapshot(userId: string) {
  let session = getActiveSessionForUser(userId);
  if (!session) session = await recoverSessionFromDb(userId);
  if (!session) {
    return {
      hasSession: false as const,
      status: "none" as const,
      sessionId: null as string | null,
      partner: null,
      messages: [] as ChatMessage[],
      myDecision: "pending" as Decision,
      partnerDecision: "pending" as Decision,
    };
  }

  const isA = session.userAId === userId;
  const partnerId = isA ? session.userBId : session.userAId;
  const queued = partnerId === userId;

  let partner = null;
  if (!queued) {
    const rows = await db.select().from(profiles).where(eq(profiles.userId, partnerId)).limit(1);
    partner = rows[0] ?? null;
  }

  return {
    hasSession: true as const,
    status: queued ? ("queued" as const) : ("active" as const),
    sessionId: session.id,
    partner,
    messages: session.messages,
    myDecision: isA ? session.aDecision : session.bDecision,
    partnerDecision: isA ? session.bDecision : session.aDecision,
  };
}

export async function partnerProfileFor(partnerId: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, partnerId)).limit(1);
  return profile ?? null;
}
