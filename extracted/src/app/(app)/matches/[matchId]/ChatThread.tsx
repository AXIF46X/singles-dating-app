"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

type Profile = {
  userId: string;
  name: string;
  age: number;
  location: string;
  photoUrl: string;
};

export default function ChatThread({ matchId, currentUserId }: { matchId: string; currentUserId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch(`/api/matches/${matchId}/messages`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load this conversation.");
        return;
      }
      setProfile(data.profile);
      setMessages(data.messages);
    } catch {
      setError("Could not load this conversation.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      fetch(`/api/matches/${matchId}/messages`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.messages) {
            setMessages((prev) => (data.messages.length > prev.length ? data.messages : prev));
          }
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft("");
    try {
      const res = await fetch(`/api/matches/${matchId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        setError(data.error ?? "Message could not be sent.");
      }
    } catch {
      setError("Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div className="grid h-96 place-items-center text-slate-500">Loading conversation...</div>;
  }

  if (error && !profile) {
    return (
      <div className="rounded-3xl bg-white/5 p-8 text-center ring-1 ring-white/10">
        <p className="text-slate-300">{error}</p>
        <Link href="/matches" className="mt-4 inline-block text-sm font-semibold text-rose-400 hover:text-rose-300">
          Back to matches
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[75vh] flex-col overflow-hidden rounded-3xl bg-slate-900/60 shadow-2xl shadow-rose-950/20 ring-1 ring-white/10 backdrop-blur">
      <div className="flex items-center gap-3 border-b border-white/10 p-4">
        <Link href="/matches" className="text-slate-400 transition hover:text-rose-300">
          ←
        </Link>
        {profile && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.photoUrl} alt={profile.name} className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10" />
            <div>
              <p className="font-bold text-white">
                {profile.name}
                {profile.age ? `, ${profile.age}` : ""}
              </p>
              {profile.location && <p className="text-xs text-slate-500">{profile.location}</p>}
            </div>
          </>
        )}
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-rose-300 ring-1 ring-white/10">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>
          Match
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-slate-500">You matched! Send the first message 👋</p>
        )}
        {messages.map((message) => {
          const mine = message.senderId === currentUserId;
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  mine
                    ? "rounded-br-sm bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white"
                    : "rounded-bl-sm bg-white/10 text-slate-100"
                }`}
              >
                {message.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-white/10 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-rose-400/60 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-950/40 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
