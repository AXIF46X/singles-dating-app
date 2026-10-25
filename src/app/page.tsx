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
};

type MeResponse = {
  user: { id: string; email: string; createdAt: string } | null;
  profile: Profile | null;
};

type View = "chat" | "matches" | "profile";

type ActiveThread = { matchId: string; partner: Profile } | null;

export default function Home() {
  const [booted, setBooted] = useState(false);
  const [user, setUser] = useState<MeResponse["user"]>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [view, setView] = useState<View>("chat");
  const [activeThread, setActiveThread] = useState<ActiveThread>(null);

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

  // Background ambient gradient shared across all screens
  const ambient = (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-rose-600/20 blur-[120px]" />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-700/10 blur-[120px]" />
      </div>
    </>
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

  /* ---------- 1. Not signed in: hero + auth form ---------- */
  if (!user) {
    return (
      <main className="relative min-h-screen bg-slate-950 text-slate-100">
        {ambient}
        <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-2">
          {/* hero copy */}
          <section>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-300 ring-1 ring-white/10">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
              Live now — spontaneous dating
            </span>
            <h1 className="mt-5 text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.05] tracking-tight text-white">
              Meet someone new.
              <br />
              <span className="bg-gradient-to-r from-rose-400 to-fuchsia-400 bg-clip-text text-transparent">
                Right now.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-400">
              Singles drops you into a fun, short live chat with a random single.
              Connect like Omegle. If it clicks, match. If not, tap Next — no hard feelings.
            </p>
            <ul className="mt-8 space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="text-rose-400">▶</span> One-tap Connect to a random stranger
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-400">▶</span> Hit Disconnect anytime, or Next for someone new
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-400">▶</span> Both Like each other? You match and keep talking
              </li>
            </ul>
          </section>

          {/* auth card */}
          <section className="flex flex-col items-center">
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
            <p className="mt-4 text-xs text-slate-500">
              Try a demo partner with email <span className="text-slate-400">demo.ava@singles.app</span> / password <span className="text-slate-400">singles-demo</span>
            </p>
          </section>
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
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Build your Singles profile</h1>
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
