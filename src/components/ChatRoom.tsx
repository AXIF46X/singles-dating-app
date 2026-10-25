"use client";

import { useEffect, useRef, useState } from "react";
import AvatarAnimator from "@/components/AvatarAnimator";

type PartnerProfile = {
  userId: string;
  name: string;
  age: number;
  gender: string;
  location: string;
  bio: string;
  interests: string[];
  photoUrl: string;
};

type WireMessage = {
  id: string;
  senderId: string;
  text: string;
  at: number;
};

type LogEntry =
  | { id: string; kind: "system"; text: string; tone?: "info" | "danger" | "success" }
  | { id: string; kind: "chat"; fromMe: boolean; text: string; at: number };

type Snapshot = {
  hasSession: boolean;
  status: "none" | "queued" | "active";
  sessionId: string | null;
  partner: PartnerProfile | null;
  messages: WireMessage[];
  myDecision: "liked" | "passed" | "pending";
  partnerDecision: "liked" | "passed" | "pending";
};

type SessionStatus = "idle" | "connecting" | "connected" | "feedback" | "matched";

const FEEDBACK_SECONDS = 6;
let logId = 0;
const nextLogId = () => `log-${++logId}`;

export default function ChatRoom({
  currentUserId,
  myName,
  myPhotoUrl,
  onOpenMatches,
  interests = [],
}: {
  currentUserId: string;
  myName: string;
  myPhotoUrl: string;
  onOpenMatches?: () => void;
  interests?: string[];
}) {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [log, setLog] = useState<LogEntry[]>([
    {
      id: nextLogId(),
      kind: "system",
      text: "Welcome to Singles. Press Connect to meet a random stranger looking for a spark.",
      tone: "info",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [matched, setMatched] = useState<{ matchId: string; partner: PartnerProfile } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(FEEDBACK_SECONDS);
  const [partnerTalking, setPartnerTalking] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [myDecision, setMyDecision] = useState<"liked" | "passed" | "pending">("pending");
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const talkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queuePollRef = useRef<NodeJS.Timeout | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<SessionStatus>(status);
  statusRef.current = status;
  const partnerRef = useRef<PartnerProfile | null>(partner);
  partnerRef.current = partner;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log.length, partnerTyping, status]);

  function clearTimers() {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (queuePollRef.current) clearInterval(queuePollRef.current);
  }

  function addSystemLog(text: string, tone: "info" | "danger" | "success" = "info") {
    setLog((prev) => [...prev, { id: nextLogId(), kind: "system", text, tone }]);
  }

  function addChatMessage(message: WireMessage) {
    setLog((prev) => {
      if (prev.some((entry) => entry.id === message.id)) return prev;
      return [
        ...prev,
        {
          id: message.id,
          kind: "chat",
          fromMe: message.senderId === currentUserId,
          text: message.text,
          at: message.at,
        },
      ];
    });
  }

  function applySnapshot(data: Snapshot) {
    setSessionId(data.sessionId);
    setMyDecision(data.myDecision);
    if (data.status === "queued") {
      setStatus("connecting");
      startQueuePolling();
      return;
    }
    if (data.partner) {
      setPartner(data.partner);
      for (const message of data.messages ?? []) addChatMessage(message);
      setStatus("connected");
      setPartnerTalking(true);
      addSystemLog("You're now chatting with a random stranger. Say hi!", "success");
      startFeedbackWindow();
    }
  }

  /* ---------- hydrate from backend + live events ---------- */
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        // Fetch online count + chat state in parallel for a snappier load
        const [stateRes, onlineRes] = await Promise.all([
          fetch("/api/chat/state", { cache: "no-store" }),
          fetch("/api/online", { cache: "no-store" }),
        ]);
        if (onlineRes.ok) {
          const online = await onlineRes.json();
          if (typeof online?.online === "number") {
            setOnlineCount(Math.max(1, online.online));
          }
        }
        if (!stateRes.ok) return;
        const data: Snapshot = await stateRes.json();
        if (cancelled || !data.hasSession) return;
        applySnapshot(data);
      } catch {
        // ignore
      }
    }

    hydrate();

    const es = new EventSource("/api/chat/events");
    es.onmessage = (event) => {
      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type === "chat" && data.message) {
        setPartnerTyping(false);
        addChatMessage(data.message);
        if (data.message.senderId !== currentUserId) {
          setPartnerTalking(true);
          if (talkingTimeoutRef.current) clearTimeout(talkingTimeoutRef.current);
          talkingTimeoutRef.current = setTimeout(() => setPartnerTalking(false), 1600);
        }
      } else if (data.type === "typing") {
        if (statusRef.current === "connected") {
          setPartnerTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 4000);
        }
      } else if (data.type === "partner_left") {
        handleDisconnect(false);
        addSystemLog("Your conversational partner has disconnected.", "danger");
      } else if (data.type === "decision") {
        if (data.matched && data.matchId && partnerRef.current) {
          clearTimers();
          setMatched({ matchId: data.matchId, partner: partnerRef.current });
          setStatus("matched");
          addSystemLog("You both liked each other — it's a match!", "success");
        }
      } else if (data.type === "online_count" && typeof data.count === "number") {
        setOnlineCount(Math.max(1, data.count));
      }
    };

    return () => {
      cancelled = true;
      clearTimers();
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  function startQueuePolling() {
    if (queuePollRef.current) clearInterval(queuePollRef.current);
    queuePollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/chat/state", { cache: "no-store" });
        if (!res.ok) return;
        const data: Snapshot = await res.json();
        if (data.hasSession && data.status === "active" && data.partner) {
          if (queuePollRef.current) clearInterval(queuePollRef.current);
          setSessionId(data.sessionId);
          setPartner(data.partner);
          setStatus("connected");
          setPartnerTalking(true);
          addSystemLog("You're now chatting with a random stranger. Say hi!", "success");
          startFeedbackWindow();
        }
      } catch {
        // ignore
      }
    }, 2500);
  }

  function startFeedbackWindow() {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSecondsLeft(FEEDBACK_SECONDS);

    let countdown = FEEDBACK_SECONDS;
    countdownRef.current = setInterval(() => {
      countdown -= 1;
      setSecondsLeft(Math.max(countdown, 0));
      if (countdown <= 0 && countdownRef.current) clearInterval(countdownRef.current);
    }, 1000);

    feedbackTimerRef.current = setTimeout(async () => {
      setPartnerTalking(false);
      try {
        const res = await fetch("/api/chat/state", { cache: "no-store" });
        if (res.ok) {
          const data: Snapshot = await res.json();
          setMyDecision(data.myDecision);
        }
      } catch {
        // ignore
      }
      if (statusRef.current === "connected") {
        setStatus("feedback");
        addSystemLog("Time's up — Like or Pass to continue.", "info");
      }
    }, FEEDBACK_SECONDS * 1000);
  }

  /* ---------- connection controls (Omegle style) ---------- */

  async function handleConnect() {
    setStatus("connecting");
    setMatched(null);
    setMyDecision("pending");
    setPartnerTyping(false);
    addSystemLog("Connecting to server...");
    try {
      const res = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests }),
      });
      if (!res.ok) throw new Error();
      const data: Snapshot = await res.json();
      if (!data.hasSession) throw new Error();
      setSessionId(data.sessionId);
      if (data.status === "queued") {
        addSystemLog("Looking for someone you can chat with...", "info");
        startQueuePolling();
        return;
      }
      setPartner(data.partner);
      for (const message of data.messages ?? []) addChatMessage(message);
      setStatus("connected");
      setPartnerTalking(true);
      addSystemLog("You're now chatting with a random stranger. Say hi!", "success");
      startFeedbackWindow();
    } catch {
      setStatus("idle");
      addSystemLog("Could not connect. Please try again.", "danger");
    }
  }

  async function handleDisconnect(notifyServer = true) {
    clearTimers();
    setPartnerTyping(false);
    if (notifyServer) {
      addSystemLog("Disconnecting...");
      await fetch("/api/chat/end", { method: "POST" }).catch(() => {});
    }
    setStatus("idle");
    setPartner(null);
    setSessionId(null);
    setMatched(null);
    setMyDecision("pending");
    if (notifyServer)
      addSystemLog("You have disconnected. Press Connect to meet someone new.", "info");
  }

  async function handleNext() {
    clearTimers();
    setStatus("connecting");
    setPartner(null);
    setSessionId(null);
    setMatched(null);
    setMyDecision("pending");
    setPartnerTyping(false);
    addSystemLog("Finding a new stranger...");
    try {
      const res = await fetch("/api/chat/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests }),
      });
      if (!res.ok) throw new Error();
      const data: Snapshot = await res.json();
      setSessionId(data.sessionId);
      if (data.status === "queued") {
        addSystemLog("Everyone's busy — you're in the queue.", "info");
        startQueuePolling();
        return;
      }
      setPartner(data.partner);
      setStatus("connected");
      setPartnerTalking(true);
      addSystemLog("You're now chatting with a random stranger. Say hi!", "success");
      startFeedbackWindow();
    } catch {
      setStatus("idle");
      addSystemLog("Could not connect. Please try again.", "danger");
    }
  }

  /* ---------- chat + decisions ---------- */

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || status !== "connected" || !sessionId) return;
    setDraft("");
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok && data.message) addChatMessage(data.message);
    } catch {
      addSystemLog("Message failed to send.", "danger");
    }
  }

  async function submitDecision(decision: "liked" | "passed") {
    if (!sessionId) return;
    setMyDecision(decision);
    try {
      const res = await fetch("/api/chat/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, decision }),
      });
      const data = await res.json();
      if (res.ok && data.matched && data.matchId && partner) {
        clearTimers();
        setMatched({ matchId: data.matchId, partner });
        setStatus("matched");
        addSystemLog("You both liked each other — it's a match!", "success");
      } else if (res.ok && decision === "passed") {
        addSystemLog("You passed on this stranger. Tap Next to keep looking.", "info");
      }
    } catch {
      // ignore
    }
  }

  /* ---------- render ---------- */

  const connected = status === "connected";
  const partnerName = partner?.name ?? "Stranger";
  const sharedInterests =
    partner?.interests && interests.length > 0
      ? partner.interests.filter((t) =>
          interests.map((s) => s.toLowerCase()).includes(t.toLowerCase()),
        )
      : [];

  return (
    <div className="mx-auto max-w-5xl">
      {/* status banner */}
      <div
        className={`mb-4 flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold ring-1 ${
          connected || status === "feedback"
            ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
            : status === "connecting"
              ? "bg-amber-500/10 text-amber-300 ring-amber-500/30"
              : status === "matched"
                ? "bg-rose-500/10 text-rose-300 ring-rose-500/30"
                : "bg-white/5 text-slate-400 ring-white/10"
        }`}
      >
        <span>
          {connected && "Connected — say hi before the timer runs out!"}
          {status === "feedback" && "Decision time — Like or Pass."}
          {status === "connecting" && "Scanning for a stranger nearby..."}
          {status === "idle" && "Not connected. Press Connect to start."}
          {status === "matched" && "It's a match! Continue in your matches."}
        </span>
        <span className="flex items-center gap-3 text-xs uppercase tracking-wider">
          {onlineCount !== null && (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
              </span>
              {onlineCount} online
            </span>
          )}
          {(connected || status === "feedback") && (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          )}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* video windows */}
        <div className="space-y-4">
          {/* stranger window */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 ring-1 ring-white/10">
            <div className="relative aspect-[4/3]">
              {partner && status !== "idle" && status !== "connecting" ? (
                <AvatarAnimator
                  photoUrl={partner.photoUrl}
                  name={partner.name}
                  talking={partnerTalking}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.12),transparent_65%)]">
                  <div className="text-center">
                    {status === "connecting" ? (
                      <>
                        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-rose-400" />
                        <p className="mt-3 text-sm font-medium text-white/70">Searching for a stranger...</p>
                      </>
                    ) : (
                      <>
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/5 text-3xl ring-1 ring-white/10">
                          <span aria-hidden>👤</span>
                        </div>
                        <p className="mt-3 text-sm font-medium text-white/50">Stranger video</p>
                      </>
                    )}
                  </div>
                </div>
              )}
              {/* overlay name tag */}
              <div className="absolute left-3 top-3 flex items-center gap-2">
                <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm ring-1 ring-white/10">
                  {partner && status !== "idle" && status !== "connecting"
                    ? `${partnerName}${partner.age ? `, ${partner.age}` : ""}`
                    : "Stranger"}
                </span>
                {connected && (
                  <span className="rounded-full bg-rose-500/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    {secondsLeft}s
                  </span>
                )}
              </div>
              {partner?.location && status !== "idle" && status !== "connecting" && (
                <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white/80 backdrop-blur-sm ring-1 ring-white/10">
                  {partner.location}
                </div>
              )}
              {partnerTyping && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm ring-1 ring-white/10">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80" />
                </div>
              )}
            </div>
          </div>

          {/* shared-interests strip — only when matched on shared topics */}
          {connected && sharedInterests.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs ring-1 ring-white/10">
              <span className="font-semibold uppercase tracking-wider text-slate-400">
                Both like:
              </span>
              {sharedInterests.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-2.5 py-0.5 font-semibold text-white"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* you window */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 ring-1 ring-white/10">
            <div className="relative aspect-[4/3]">
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-slate-800 to-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={myPhotoUrl}
                  alt={myName}
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-rose-500/40"
                />
              </div>
              <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm ring-1 ring-white/10">
                You — {myName}
              </div>
            </div>
          </div>

          {/* controls — Omegle style Connect / Disconnect / Next */}
          <div className="flex gap-3">
            {status === "idle" || status === "matched" ? (
              <button
                onClick={handleConnect}
                className="flex-1 rounded-2xl bg-emerald-500 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-950/50 transition hover:bg-emerald-400 active:scale-[0.98]"
              >
                Connect
              </button>
            ) : (
              <>
                {(connected || status === "feedback") && (
                  <button
                    onClick={handleNext}
                    className="flex-1 rounded-2xl bg-white px-6 py-4 text-base font-extrabold text-slate-900 shadow-lg transition hover:bg-slate-100 active:scale-[0.98]"
                  >
                    Next
                  </button>
                )}
                {status === "connecting" && (
                  <div className="flex flex-1 items-center justify-center rounded-2xl bg-white/5 px-6 py-4 text-base font-extrabold text-white/60 ring-1 ring-white/10">
                    Connecting<span className="ml-1 animate-pulse">...</span>
                  </div>
                )}
                <button
                  onClick={() => handleDisconnect(true)}
                  className="flex-1 rounded-2xl bg-rose-600 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-rose-950/50 transition hover:bg-rose-500 active:scale-[0.98]"
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        {/* chat log */}
        <div className="flex flex-col overflow-hidden rounded-3xl bg-slate-900/70 ring-1 ring-white/10">
          <div className="border-b border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Chat log
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ minHeight: 280, maxHeight: 420 }}>
            {log.map((entry) => {
              if (entry.kind === "system") {
                return (
                  <p
                    key={entry.id}
                    className={`text-xs italic ${
                      entry.tone === "danger"
                        ? "text-rose-400"
                        : entry.tone === "success"
                          ? "text-emerald-400"
                          : "text-slate-500"
                    }`}
                  >
                    {entry.text}
                  </p>
                );
              }
              return (
                <p key={entry.id} className="break-words text-sm leading-relaxed">
                  <span className={`font-bold ${entry.fromMe ? "text-rose-400" : "text-sky-400"}`}>
                    {entry.fromMe ? "You" : partnerName}:
                  </span>{" "}
                  <span className="text-slate-200">{entry.text}</span>
                </p>
              );
            })}
            {partnerTyping && <p className="text-xs italic text-sky-300">{partnerName} is typing…</p>}
            <div ref={bottomRef} />
          </div>

          {/* decision bar */}
          {status === "feedback" && (
            <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-3">
              <button
                onClick={() => submitDecision("passed")}
                disabled={myDecision !== "pending"}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/80 hover:bg-white/10 disabled:opacity-50"
              >
                Pass
              </button>
              <button
                onClick={() => submitDecision("liked")}
                disabled={myDecision !== "pending"}
                className="rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-950/40 disabled:opacity-50"
              >
                Like
              </button>
            </div>
          )}

          {/* message input */}
          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-white/10 p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={!connected}
              placeholder={connected ? "Type a message..." : "Connect to start chatting"}
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-rose-400/60 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!connected || !draft.trim()}
              className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-950/40 disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* match modal */}
      {status === "matched" && matched && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-br from-rose-600 to-fuchsia-800 p-8 text-center shadow-2xl ring-1 ring-white/20">
            <p className="text-sm font-bold uppercase tracking-widest text-white/80">It&rsquo;s a match!</p>
            <div className="mx-auto mt-4 h-24 w-24 overflow-hidden rounded-full ring-4 ring-white/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={matched.partner.photoUrl}
                alt={matched.partner.name}
                className="h-full w-full object-cover"
              />
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">
              You and {matched.partner.name} liked each other
            </h2>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => onOpenMatches?.()}
                className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-rose-600 shadow-md"
              >
                Open match chat
              </button>
              <button
                onClick={handleConnect}
                className="rounded-full border border-white/30 px-6 py-2.5 text-sm font-bold text-white hover:bg-white/10"
              >
                Connect with someone new
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
