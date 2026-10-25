import "server-only";
import { db } from "@/lib/db";
import { normalizeProfile } from "@/lib/auth";

export async function getMatchesForUser(userId: string) {
  const rows = await db.match.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    orderBy: { createdAt: "desc" },
  });

  const results = [];
  for (const match of rows) {
    const otherId = match.userAId === userId ? match.userBId : match.userAId;
    const profileRow = await db.profile.findUnique({ where: { userId: otherId } });
    const profile = profileRow ? normalizeProfile(profileRow) : null;

    const lastMessageRows = await db.message.findMany({
      where: { matchId: match.id },
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    const last = lastMessageRows[0] ?? null;
    results.push({
      matchId: match.id,
      createdAt: match.createdAt,
      profile,
      lastMessage: last
        ? {
            id: last.id,
            matchId: last.matchId,
            senderId: last.senderId,
            content: last.content,
            createdAt: last.createdAt,
          }
        : null,
    });
  }

  return results;
}
