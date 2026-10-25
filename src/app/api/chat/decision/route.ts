import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setDecision } from "@/lib/rt";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { sessionId, decision } = await request.json().catch(() => ({}));
  if (decision !== "liked" && decision !== "passed") {
    return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
  }

  const result = await setDecision(user.id, decision);
  return NextResponse.json(result);
}
