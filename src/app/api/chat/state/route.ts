import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStateSnapshot } from "@/lib/rt";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const snapshot = await getStateSnapshot(user.id);
  return NextResponse.json(snapshot);
}
