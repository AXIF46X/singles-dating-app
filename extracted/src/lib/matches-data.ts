import "server-only";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { matches, messages, profiles } from "@/db/schema";

export async function getMatchesForUser(userId: string) {
  const rows = await db
    .select()
    .from(matches)
    .where(or(eq(matches.userAId, userId), eq(matches.userBId, userId)))
    .orderBy(desc(matches.createdAt));

  const results = [];
  for (const match of rows) {
    const otherId = match.userAId === userId ? match.userBId : match.userAId;
    const profileRows = await db.select().from(profiles).where(eq(profiles.userId, otherId)).limit(1);
    const lastMessageRows = await db
      .select()
      .from(messages)
      .where(eq(messages.matchId, match.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    results.push({
      matchId: match.id,
      createdAt: match.createdAt,
      profile: profileRows[0] ?? null,
      lastMessage: lastMessageRows[0] ?? null,
    });
  }

  return results;
}
