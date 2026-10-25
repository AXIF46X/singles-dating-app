import "server-only";
import { cookies, headers } from "next/headers";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "singlescan_session";
export const SESSION_HEADER = "x-session-token";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function createSession(userId: string) {
  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { token, userId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.delete({ where: { token } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  // Prefer the x-session-token header (works inside cross-origin iframes where
  // third-party cookies are blocked), then fall back to the session cookie.
  const headerStore = await headers();
  const headerToken = headerStore.get(SESSION_HEADER);
  const cookieStore = await cookies();
  const token = headerToken || cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  return validateSessionToken(token);
}

/** Shared token validation used by header/cookie auth. */
async function validateSessionToken(token: string) {
  const row = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { token } }).catch(() => {});
    return null;
  }

  return {
    id: row.user.id,
    email: row.user.email,
    createdAt: row.user.createdAt,
  };
}

/**
 * Auth for endpoints that cannot send custom headers (e.g. EventSource SSE).
 * Accepts ?token=... in the query string, then falls back to header/cookie.
 */
export async function getCurrentUserWithTokenParam(request: Request) {
  const url = new URL(request.url);
  const tokenParam = url.searchParams.get("token");
  if (tokenParam) {
    const user = await validateSessionToken(tokenParam);
    if (user) return user;
  }
  return getCurrentUser();
}

export type ProfileRow = {
  userId: string;
  name: string;
  age: number;
  gender: string;
  lookingFor: string;
  location: string;
  bio: string;
  interests: string[];
  photoUrl: string;
  updatedAt: Date;
};

/** Normalize a Prisma Profile row into the shape the client expects. */
export function normalizeProfile(row: {
  userId: string;
  name: string;
  age: number;
  gender: string;
  lookingFor: string;
  location: string;
  bio: string;
  interests: string | string[] | null;
  photoUrl: string | null;
  updatedAt: Date;
}): ProfileRow {
  let interests: string[] = [];
  if (Array.isArray(row.interests)) {
    interests = row.interests as string[];
  } else if (typeof row.interests === "string" && row.interests.trim().length > 0) {
    try {
      const parsed = JSON.parse(row.interests);
      if (Array.isArray(parsed)) interests = parsed.filter((v) => typeof v === "string");
    } catch {
      // ignore broken JSON
    }
  }
  return {
    userId: row.userId,
    name: row.name,
    age: row.age,
    gender: row.gender ?? "",
    lookingFor: row.lookingFor ?? "",
    location: row.location ?? "",
    bio: row.bio ?? "",
    interests,
    photoUrl: row.photoUrl ?? "",
    updatedAt: row.updatedAt,
  };
}

export async function getCurrentUserWithProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const profileRow = await db.profile.findUnique({ where: { userId: user.id } });
  const profile = profileRow ? normalizeProfile(profileRow) : null;
  return { user, profile };
}
