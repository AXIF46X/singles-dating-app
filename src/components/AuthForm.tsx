"use client";

import { useState } from "react";

export default function AuthForm({
  mode,
  onAuthenticated,
}: {
  mode: "login" | "signup";
  onAuthenticated?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      onAuthenticated?.();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-lg shadow-lg shadow-rose-950/50">
            <span aria-hidden>💘</span>
          </span>
          <span className="text-xl font-bold tracking-tight text-white">Singles</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {mode === "login"
            ? "Log in to keep meeting people."
            : "Join and start meeting new singles instantly."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl bg-white/5 p-6 shadow-2xl shadow-rose-950/20 ring-1 ring-white/10 backdrop-blur"
      >
        {error && (
          <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300 ring-1 ring-rose-500/30">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-300">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-rose-400/60 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-300">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-rose-400/60 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            placeholder="At least 6 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-rose-950/40 transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>
    </div>
  );
}
