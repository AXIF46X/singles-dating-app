import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  age: z.coerce.number().int().min(18, "You must be at least 18").max(120),
  gender: z.string().trim().max(40).default(""),
  lookingFor: z.string().trim().max(40).default(""),
  location: z.string().trim().max(120).default(""),
  bio: z.string().trim().max(600).default(""),
  interests: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  photoUrl: z.string().trim().max(2000).default(""),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const photoUrl = data.photoUrl || `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(user.id)}`;

  const existing = await db.select({ userId: profiles.userId }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);

  if (existing[0]) {
    await db
      .update(profiles)
      .set({ ...data, photoUrl, updatedAt: new Date() })
      .where(eq(profiles.userId, user.id));
  } else {
    await db.insert(profiles).values({ userId: user.id, ...data, photoUrl });
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);

  return NextResponse.json({ profile });
}
