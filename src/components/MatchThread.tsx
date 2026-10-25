"use client";

import { useEffect, useRef, useState } from "react";

type Profile = {
  userId: string;
  name: string;
  age: number;
  location: string;
  photoUrl: string;
  bio: string;
  interests: string[];
};

type ThreadMessage = {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export default function MatchThread({
  matchId,
  partner,
  currentUserId,
  onBack,
}: {
  matchId: string;
  partner: Profile;
  currentUserId: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/messages`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // refresh every 3s to surface new messages from the partner
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Could not send message.");
        return;
      }
      setDraft("");
      await load();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[70vh] max-w-3xl flex-col overflow-hidden rounded-3xl bg-slate-900/70 ring-1 ring-white/10">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <button
          onClick={onBack}
          className="rounded-full px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10"
        >
          ← Back
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={partner.photoUrl}
          alt={partner.name}
          className="h-9 w-9 rounded-full object-cover ring-1 ring-white/20"
        />
        <div>
          <p className="text-sm font-bold text-white">
            {partner.name}, {partner.age}
          </p>
          {partner.location && (
            <p className="text-xs text-slate-400">{partner.location}</p>
          )}
        </div>
      </div>

      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {loading ? (
          <p className="text-center text-sm text-slate-500">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">No messages yet. Say hello!</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white"
                      : "bg-white/10 text-slate-200"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && <p className="px-4 py-1 text-xs text-rose-400">{error}</p>}

      <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-rose-400/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-950/40 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
