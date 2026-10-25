import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStateSnapshot, nextPartner } from "@/lib/rt";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  await nextPartner(user.id);
  const snapshot = await getStateSnapshot(user.id);
  return NextResponse.json(snapshot);
}
