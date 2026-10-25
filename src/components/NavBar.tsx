"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/client";

export default function NavBar({
  photoUrl,
  name,
  view,
  onNavigate,
  onLogout,
}: {
  photoUrl?: string | null;
  name?: string | null;
  view: "chat" | "matches" | "profile";
  onNavigate: (v: "chat" | "matches" | "profile") => void;
  onLogout: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setLoading(false);
      onLogout();
    }
  }

  const navItemClass = (active: boolean) =>
    `rounded-full px-3 py-2 text-sm font-medium transition hover:bg-white/10 hover:text-white sm:px-4 ${
      active ? "bg-white/10 text-white" : "text-slate-300"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <button
          type="button"
          onClick={() => onNavigate("chat")}
          className="flex items-center gap-2"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-base shadow-lg shadow-rose-950/50">
            <span aria-hidden>💘</span>
          </span>
          <span className="text-lg font-bold tracking-tight text-white">Singles</span>
        </button>

        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => onNavigate("chat")}
            className={navItemClass(view === "chat")}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => onNavigate("matches")}
            className={navItemClass(view === "matches")}
          >
            Matches
          </button>
          <button
            type="button"
            onClick={() => onNavigate("profile")}
            className={`flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium transition hover:bg-white/10 hover:text-white sm:px-3 ${
              view === "profile" ? "bg-white/10 text-white" : "text-slate-300"
            }`}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={name ?? "Your profile"}
                className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20"
              />
            ) : (
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs">
                🙂
              </span>
            )}
            <span className="hidden sm:inline">Profile</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-60"
          >
            {loading ? "..." : "Log out"}
          </button>
        </nav>
      </div>
    </header>
  );
}
