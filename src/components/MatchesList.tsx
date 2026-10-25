"use client";

import { useEffect, useState } from "react";

type Profile = {
  userId: string;
  name: string;
  age: number;
  location: string;
  photoUrl: string;
  bio: string;
  interests: string[];
};

type LastMessage = {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
} | null;

type Match = {
  matchId: string;
  createdAt: string;
  profile: Profile | null;
  lastMessage: LastMessage;
};

export default function MatchesList({
  currentUserId,
  onOpenThread,
  onBack,
}: {
  currentUserId: string;
  onOpenThread: (matchId: string, partner: Profile) => void;
  onBack: () => void;
}) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/matches", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl text-center text-slate-400">Loading your matches…</div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl bg-white/5 p-10 text-center ring-1 ring-white/10">
        <p className="text-3xl">💔</p>
        <h2 className="mt-4 text-xl font-bold text-white">No matches yet</h2>
        <p className="mt-2 text-sm text-slate-400">
          Connect with strangers in the chat workspace and Like them to make a match.
        </p>
        <button
          onClick={onBack}
          className="mt-6 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-950/40"
        >
          Go to chat
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Your matches</h1>
        <span className="text-sm text-slate-400">{matches.length} total</span>
      </div>
      {matches.map((m) => {
        const p = m.profile;
        if (!p) return null;
        const lastFromMe = m.lastMessage?.senderId === currentUserId;
        return (
          <button
            key={m.matchId}
            onClick={() => onOpenThread(m.matchId, p)}
            className="flex w-full items-center gap-4 rounded-2xl bg-white/5 p-4 text-left ring-1 ring-white/10 transition hover:bg-white/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.photoUrl}
              alt={p.name}
              className="h-14 w-14 rounded-full object-cover ring-1 ring-white/20"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate font-bold text-white">
                  {p.name}, {p.age}
                </p>
                <span className="text-xs text-slate-500">
                  {new Date(m.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-slate-400">
                {m.lastMessage
                  ? `${lastFromMe ? "You: " : ""}${m.lastMessage.content}`
                  : "Say hello 👋"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
