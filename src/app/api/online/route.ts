import { NextResponse } from "next/server";
import { getOnlineCount } from "@/lib/rt";

export const dynamic = "force-dynamic";

/** Returns the count of real (non-demo) users currently online. */
export async function GET() {
  return NextResponse.json({ online: getOnlineCount() });
}
