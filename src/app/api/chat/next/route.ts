import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStateSnapshot, nextPartner } from "@/lib/rt";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const interests: string[] = Array.isArray(body?.interests)
    ? body.interests.filter((t: any) => typeof t === "string").slice(0, 8)
    : [];

  await nextPartner(user.id, interests);
  const snapshot = await getStateSnapshot(user.id);
  return NextResponse.json(snapshot);
}
