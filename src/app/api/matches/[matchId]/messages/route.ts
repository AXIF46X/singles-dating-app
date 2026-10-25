import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function getAuthorizedMatch(matchId: string, userId: string) {
  const match = await db.match.findFirst({
    where: {
      id: matchId,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
  });
  return match ?? null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ matchId: string }> },
) {
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
  const profileRow = await db.profile.findUnique({ where: { userId: otherId } });
  const thread = await db.message.findMany({
    where: { matchId },
    orderBy: { createdAt: "asc" },
  });

  const profile = profileRow
    ? {
        ...profileRow,
        interests: (() => {
          try {
            const parsed = JSON.parse(profileRow.interests ?? "[]");
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })(),
      }
    : null;

  return NextResponse.json({ profile, messages: thread, currentUserId: user.id });
}

const schema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(1000),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ matchId: string }> },
) {
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

  const message = await db.message.create({
    data: { matchId, senderId: user.id, content: parsed.data.content },
  });

  return NextResponse.json({ message });
}
