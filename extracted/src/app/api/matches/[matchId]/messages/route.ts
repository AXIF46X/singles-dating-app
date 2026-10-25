import { NextResponse } from "next/server";
import { and, asc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { matches, messages, profiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

async function getAuthorizedMatch(matchId: string, userId: string) {
  const rows = await db
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), or(eq(matches.userAId, userId), eq(matches.userBId, userId))))
    .limit(1);
  return rows[0] ?? null;
}

export async function GET(_request: Request, context: { params: Promise<{ matchId: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { matchId } = await context.params;
  const match = await getAuthorizedMatch(matchId, user.id);
  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  const otherId = match.userAId === user.id ? match.userBId : match.userAId;
  const profileRows = await db.select().from(profiles).where(eq(profiles.userId, otherId)).limit(1);
  const thread = await db
    .select()
    .from(messages)
    .where(eq(messages.matchId, matchId))
    .orderBy(asc(messages.createdAt));

  return NextResponse.json({ profile: profileRows[0] ?? null, messages: thread, currentUserId: user.id });
}

const schema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(1000),
});

export async function POST(request: Request, context: { params: Promise<{ matchId: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { matchId } = await context.params;
  const match = await getAuthorizedMatch(matchId, user.id);
  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const [message] = await db
    .insert(messages)
    .values({ matchId, senderId: user.id, content: parsed.data.content })
    .returning();

  return NextResponse.json({ message });
}
