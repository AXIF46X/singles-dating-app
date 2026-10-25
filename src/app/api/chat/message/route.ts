import { NextResponse } from "next/server";
import { getActiveSessionForUser, publish, pushMessage } from "@/lib/rt";
import { getCurrentUser } from "@/lib/auth";

const DEMO_REPLIES = [
  "That's so cool! Tell me more 😄",
  "I love that! What do you like to do for fun?",
  "Nice! I'm big into music and hiking, what about you?",
  "Haha, that's awesome 😂",
  "I'd love to grab a coffee sometime 🙂",
  "You seem fun! What made you join?",
  "Same here! We should talk more",
  "Aww that's sweet 💕",
];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { text } = await request.json().catch(() => ({}));
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const session = getActiveSessionForUser(user.id);
  if (!session) {
    return NextResponse.json({ error: "No active session." }, { status: 404 });
  }

  const message = await pushMessage(session.id, user.id, text.trim().slice(0, 500));

  // demo partner auto-replies after a short delay, with a typing indicator
  if (session.bIsDemo) {
    const reply = DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];
    const delay = 1800 + Math.random() * 2200;
    setTimeout(() => {
      publish(user.id, { type: "typing", sessionId: session.id });
    }, 800);
    setTimeout(() => {
      void pushMessage(session.id, session.userBId, reply).catch(() => {});
    }, delay);
  }

  return NextResponse.json({ ok: true, message });
}
