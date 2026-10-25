import { NextResponse } from "next/server";
import { getCurrentUserWithProfile } from "@/lib/auth";

export async function GET() {
  const data = await getCurrentUserWithProfile();
  if (!data) {
    return NextResponse.json({ user: null, profile: null });
  }
  return NextResponse.json(data);
}
