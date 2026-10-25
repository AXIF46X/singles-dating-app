import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

const ADJECTIVES = [
  "Mystery",
  "Cosmic",
  "Velvet",
  "Stardust",
  "Midnight",
  "Electric",
  "Lunar",
  "Wild",
  "Golden",
  "Neon",
];
const NOUNS = [
  "Traveler",
  "Wanderer",
  "Voyager",
  "Spirit",
  "Phoenix",
  "Comet",
  "Drifter",
  "Nomad",
  "Echo",
  "Mirage",
];

function randomStrangerName() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const n2 = Math.floor(Math.random() * 90 + 10);
  return `${a} ${n} ${n2}`;
}

function randomAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(seed)}`;
}

/**
 * Creates an anonymous "stranger" account instantly — no email, no password.
 * The user is paired with another stranger (real or demo) the moment they
 * press Connect on the chat workspace.
 *
 * Anonymous accounts are flagged isDemo=false so they count toward the live
 * online counter, but they have no password so they can never be logged back
 * into. The session cookie is the only credential.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const interests: string[] = Array.isArray(body?.interests)
    ? body.interests.filter((t: any) => typeof t === "string").slice(0, 8)
    : [];

  const name = randomStrangerName();
  // Anonymous users have a placeholder email — collision-safe via random suffix
  const email = `anon-${crypto.randomUUID()}@singles-anon.app`;
  // No real password — anonymous accounts can never be logged back into
  const passwordHash = "$anon$" + crypto.randomUUID();

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      isDemo: false, // real user — counts toward online
    },
    select: { id: true },
  });

  await db.profile.create({
    data: {
      userId: user.id,
      name,
      age: 18, // required field; user implied 18+ by clicking Start
      gender: "",
      lookingFor: "Everyone",
      location: "",
      bio: "Anonymous stranger. Say hi 👋",
      interests: JSON.stringify(interests),
      photoUrl: randomAvatar(user.id),
    },
  });

  await createSession(user.id);

  return NextResponse.json({
    user: { id: user.id, name, interests },
    anonymous: true,
  });
}
