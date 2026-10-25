import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMatchesForUser } from "@/lib/matches-data";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const results = await getMatchesForUser(user.id);
  return NextResponse.json({ matches: results });
}
