"use client";

import { useCallback, useEffect, useState } from "react";
import AuthForm from "@/components/AuthForm";
import ChatRoom from "@/components/ChatRoom";
import MatchesList from "@/components/MatchesList";
import MatchThread from "@/components/MatchThread";
import NavBar from "@/components/NavBar";
import ProfileForm from "@/components/ProfileForm";

type Profile = {
  userId: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  photoUrl: string;
  gender: string;
  lookingFor: string;
};

type MeResponse = {
  user: { id: string; email: string; createdAt: string } | null;
  profile: Profile | null;
};

type View = "chat" | "matches" | "profile";

type ActiveThread = { matchId: string; partner: Profile } | null;

const SUGGESTED_TOPICS = [
  "music",
  "movies",
  "travel",
  "gaming",
  "art",
  "memes",
  "philosophy",
  "coding",
];

export default function Home() {
  const [booted, setBooted] = useState(false);
  const [user, setUser] = useState<MeResponse["user"]>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [view, setView] = useState<View>("chat");
  const [activeThread, setActiveThread] = useState<ActiveThread>(null);

  // Omegle-style home state
  const [interests, setInterests] = useState<string[]>([]);
  const [interestDraft, setInterestDraft] = useState("");
  const [confirmed18, setConfirmed18] = useState(false);
  const [anonStarting, setAnonStarting] = useState(false);
  const [anonError, setAnonError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  // Toggle between Omegle-style "instant start" home and the optional sign-up card
  const [showAuthCard, setShowAuthCard] = useState(false);

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) return;
      const data: MeResponse = await res.json();
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      // ignore
    } finally {
      setBooted(true);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  // Live online counter on the homepage (polling; SSE is set up once entering chat)
  useEffect(() => {
    if (user) return; // only poll when logged out on the home screen
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/online", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data?.online === "number") {
          setOnlineCount(Math.max(1, data.online));
        }
      } catch {
        // ignore
      }
    }
    void poll();
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user]);

  function addInterest(raw: string) {
    const clean = raw.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "");
    if (!clean) return;
    if (interests.includes(clean)) return;
    if (interests.length >= 8) return;
    setInterests((prev) => [...prev, clean]);
  }

  function removeInterest(t: string) {
    setInterests((prev) => prev.filter((x) => x !== t));
  }

  async function startAnonymousChat() {
    if (!confirmed18) {
      setAnonError("Please confirm you are 18+ to start chatting.");
      return;
    }
    setAnonStarting(true);
    setAnonError(null);
    try {
      const res = await fetch("/api/auth/anonymous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests }),
      });
      if (!res.ok) {
        let msg = `Request failed (HTTP ${res.status}).`;
        try {
          const data = await res.json();
          msg = data?.error ?? msg;
        } catch {
          // ignore non-JSON
        }
        setAnonError(msg);
        return;
      }
      await refreshMe();
    } catch {
      setAnonError("Cannot reach the server. Please wait a moment and try again.");
    } finally {
      setAnonStarting(false);
    }
  }

  // Background ambient gradient shared across all screens
  const ambient = (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-rose-600/20 blur-[120px]" />
      <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-[120px]" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-700/10 blur-[120px]" />
    </div>
  );

  if (!booted) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        {ambient}
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-rose-400" />
          <p className="text-sm text-slate-400">Loading Singles…</p>
        </div>
      </main>
    );
  }

  /* ---------- 1. Not signed in: Omegle-style home ---------- */
  if (!user) {
    return (
      <main className="relative min-h-screen bg-slate-950 text-slate-100">
        {ambient}
        <div className="mx-auto flex max-w-4xl flex-col items-center px-5 py-10 sm:py-16">
          {/* Brand */}
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-lg shadow-lg shadow-rose-950/50">
              <span aria-hidden>💘</span>
            </span>
            <span className="text-2xl font-bold tracking-tight text-white">Singles</span>
          </div>

          {!showAuthCard ? (
            <>
              {/* Headline */}
              <h1 className="text-center text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.05] tracking-tight text-white">
                Talk to{" "}
                <span className="bg-gradient-to-r from-rose-400 to-fuchsia-400 bg-clip-text text-transparent">
                  strangers!
                </span>
              </h1>
              <p className="mt-3 max-w-xl text-center text-base text-slate-400 sm:text-lg">
                Meet someone new in a live, anonymous chat. Press{" "}
                <span className="font-semibold text-rose-300">Start Chatting</span>{" "}
                — you&rsquo;ll be paired with a random stranger instantly. Like
                Omegle, but built for sparks. No signup, no email, no pressure.
              </p>

              {/* Live online counter */}
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-sky-300 ring-1 ring-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
                </span>
                {onlineCount !== null ? `${onlineCount} strangers online now` : "Loading…"}
              </div>

              {/* Interests input — Omegle's signature feature */}
              <div className="mt-8 w-full max-w-md">
                <label className="mb-2 block text-center text-sm font-semibold text-slate-300">
                  What do you wanna talk about?{" "}
                  <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addInterest(interestDraft);
                    setInterestDraft("");
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={interestDraft}
                    onChange={(e) => setInterestDraft(e.target.value)}
                    placeholder="music, travel, memes…"
                    className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-rose-400/60 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                  <button
                    type="submit"
                    disabled={!interestDraft.trim() || interests.length >= 8}
                    className="rounded-full bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-40"
                  >
                    Add
                  </button>
                </form>
                {interests.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {interests.map((t) => (
                      <button
                        key={t}
                        onClick={() => removeInterest(t)}
                        className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-3 py-1 text-xs font-semibold text-white shadow shadow-rose-950/40 hover:opacity-90"
                      >
                        {t} ✕
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {SUGGESTED_TOPICS.filter((t) => !interests.includes(t))
                    .slice(0, 6)
                    .map((t) => (
                      <button
                        key={t}
                        onClick={() => addInterest(t)}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-400 transition hover:border-rose-400/40 hover:text-rose-300"
                      >
                        + {t}
                      </button>
                    ))}
                </div>
              </div>

              {/* 18+ confirmation */}
              <label className="mt-8 flex cursor-pointer items-start gap-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={confirmed18}
                  onChange={(e) => setConfirmed18(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-rose-500"
                />
                <span>
                  I confirm I am at least 18 years old and agree to be respectful.
                  Harassment, nudity, and illegal content are not tolerated.
                </span>
              </label>

              {/* Big Start button */}
              <button
                onClick={startAnonymousChat}
                disabled={!confirmed18 || anonStarting}
                className="mt-6 w-full max-w-md rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-950/50 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {anonStarting ? "Connecting…" : "▶ Start Chatting"}
              </button>

              {anonError && (
                <p className="mt-3 text-sm text-rose-300">{anonError}</p>
              )}

              {/* Optional: save your matches */}
              <p className="mt-6 text-sm text-slate-500">
                Want to save your matches & profile?{" "}
                <button
                  onClick={() => setShowAuthCard(true)}
                  className="font-semibold text-rose-400 hover:text-rose-300"
                >
                  Create an account
                </button>{" "}
                · Already have one?{" "}
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setShowAuthCard(true);
                  }}
                  className="font-semibold text-rose-400 hover:text-rose-300"
                >
                  Log in
                </button>
              </p>

              {/* Try a demo account hint */}
              <p className="mt-2 text-xs text-slate-600">
                Or try a demo account: <span className="text-slate-500">demo.ava@singles.app</span>{" "}
                / <span className="text-slate-500">singles-demo</span>
              </p>
            </>
          ) : (
            /* Optional sign-up / login card (collapsible) */
            <section className="flex w-full max-w-md flex-col items-center">
              <div className="mb-6 flex gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
                <button
                  onClick={() => setAuthMode("signup")}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                    authMode === "signup"
                      ? "bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Sign up
                </button>
                <button
                  onClick={() => setAuthMode("login")}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                    authMode === "login"
                      ? "bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Log in
                </button>
              </div>
              <AuthForm mode={authMode} onAuthenticated={() => void refreshMe()} />
              <button
                onClick={() => setShowAuthCard(false)}
                className="mt-4 text-xs text-slate-500 hover:text-rose-300"
              >
                ← Back to instant chat
              </button>
            </section>
          )}
        </div>
      </main>
    );
  }

  /* ---------- 2. Signed in but no profile: onboarding ---------- */
  if (!profile) {
    return (
      <main className="relative min-h-screen bg-slate-950 text-slate-100">
        {ambient}
        <div className="mx-auto max-w-2xl px-5 py-10 sm:py-16">
          <div className="mb-8 text-center">
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                await refreshMe();
              }}
              className="float-left text-xs text-slate-400 hover:text-rose-300"
            >
              ← Log out
            </button>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
              Build your Singles profile
            </h1>
            <p className="mt-2 text-slate-400">
              This is what potential matches will see after a chat. You can update it anytime.
            </p>
          </div>
          <ProfileForm
            seedKey={user.id}
            initialValues={{ name: user.email.split("@")[0] }}
            submitLabel="Start meeting singles"
            onSaved={() => void refreshMe()}
          />
        </div>
      </main>
    );
  }

  /* ---------- 3. Full chat workspace ---------- */
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {ambient}
      <NavBar
        photoUrl={profile.photoUrl}
        name={profile.name}
        view={view}
        onNavigate={(v) => {
          setView(v);
          setActiveThread(null);
        }}
        onLogout={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          await refreshMe();
        }}
      />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {view === "chat" && (
          <ChatRoom
            currentUserId={user.id}
            myName={profile.name}
            myPhotoUrl={profile.photoUrl}
            interests={profile.interests ?? []}
            onOpenMatches={() => {
              setView("matches");
              setActiveThread(null);
            }}
          />
        )}

        {view === "matches" && activeThread && (
          <MatchThread
            matchId={activeThread.matchId}
            partner={activeThread.partner}
            currentUserId={user.id}
            onBack={() => setActiveThread(null)}
          />
        )}

        {view === "matches" && !activeThread && (
          <MatchesList
            currentUserId={user.id}
            onOpenThread={(matchId, partner) => setActiveThread({ matchId, partner })}
            onBack={() => setView("chat")}
          />
        )}

        {view === "profile" && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white">Edit your profile</h1>
              <p className="mt-2 text-slate-400">Keep your singles profile fresh — matches will see this.</p>
            </div>
            <ProfileForm
              seedKey={user.id}
              initialValues={{
                name: profile.name,
                age: String(profile.age),
                gender: profile.gender,
                lookingFor: profile.lookingFor,
                location: profile.location,
                bio: profile.bio,
                interests: profile.interests,
                photoUrl: profile.photoUrl,
              }}
              submitLabel="Save changes"
              onSaved={() => void refreshMe()}
            />
          </div>
        )}
      </div>
    </main>
  );
}
