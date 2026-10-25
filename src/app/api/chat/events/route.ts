import { NextResponse } from "next/server";
import { getCurrentUserWithTokenParam } from "@/lib/auth";
import { addOnline, removeOnline, subscribe } from "@/lib/rt";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // EventSource cannot send custom headers, so the client passes the session
  // token as ?token=... — falls back to header/cookie auth if absent.
  const user = await getCurrentUserWithTokenParam(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  addOnline(user.id);

  let unsubscribe: (() => void) | null = null;
  let heartbeat: NodeJS.Timeout | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (payload: any) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          closed = true;
        }
      };

      unsubscribe = subscribe(user.id, send);
      send({ type: "ready", userId: user.id });

      // keep the connection alive through proxies
      heartbeat = setInterval(() => send({ type: "ping", at: Date.now() }), 25000);
    },
    cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe?.();
      removeOnline(user.id);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
