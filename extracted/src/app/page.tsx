import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

const FEATURES = [
  {
    icon: "⚡",
    title: "Instant random matches",
    description: "One tap and you're connected with someone new. No endless browsing — just spontaneous live chat.",
  },
  {
    icon: "⏱",
    title: "Quick connection windows",
    description: "Chat for a moment, then both decide if you'd like to stay connected. No pressure either way.",
  },
  {
    icon: "🔒",
    title: "Safe and in control",
    description: "End any chat instantly, skip to the next person, and only match when you both liked the vibe.",
  },
];

const STEPS = [
  { step: "1", title: "Join", description: "Create your profile in under a minute with a photo and a few interests." },
  { step: "2", title: "Meet", description: "Get randomly paired with singles for short, fun live chat sessions." },
  { step: "3", title: "Match", description: "If you both liked it, become permanent matches and keep talking." },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const primaryHref = user ? "/chat" : "/signup";
  const primaryLabel = user ? "Enter live chat" : "Get started free";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-rose-600/20 blur-[120px]" />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-[120px]" />
      </div>

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-base shadow-lg shadow-rose-950/50">
            💘
          </span>
          <span className="text-lg font-bold tracking-tight text-white">Singles</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <Link
              href="/chat"
              className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-rose-950/40"
            >
              Live chat
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-rose-950/40"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-300 ring-1 ring-white/10">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
              Live now — spontaneous dating
            </span>
            <h1 className="mt-5 text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.05] tracking-tight text-white">
              Meet someone new. <br />
              <span className="bg-gradient-to-r from-rose-400 to-fuchsia-400 bg-clip-text text-transparent">
                Right now.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-400">
              Singles drops you into a fun, short live chat with a random single. If it clicks, match. If not, just tap
              next — no hard feelings.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={primaryHref}
                className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-950/50 transition hover:opacity-90"
              >
                {primaryLabel}
              </Link>
              {!user && (
                <Link
                  href="/login"
                  className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-slate-200 transition hover:bg-white/10"
                >
                  I already have an account
                </Link>
              )}
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-slate-500">
              <div>
                <p className="text-2xl font-bold text-white">50k+</p>
                <p>singles online</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="text-2xl font-bold text-white">120</p>
                <p>avg. seconds per chat</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="text-2xl font-bold text-white">∞</p>
                <p>chances to connect</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl shadow-rose-950/40 ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/avatars/leo.png" alt="Chat participant preview" className="h-3/4 w-full object-cover" />
            <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-slate-900/90 p-4 shadow-lg ring-1 ring-white/10 backdrop-blur">
              <p className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                </span>
                Leo is live — say hello!
              </p>
              <p className="mt-1 text-xs text-slate-400">Make it memorable — you might just match.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/5 bg-slate-900/40 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">Why people love Singles</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl bg-white/5 p-7 ring-1 ring-white/10 transition hover:bg-white/[0.07]"
              >
                <span className="text-3xl">{feature.icon}</span>
                <h3 className="mt-4 text-lg font-bold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">How it works</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-600 text-xl font-extrabold text-white shadow-lg shadow-rose-950/50">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-gradient-to-br from-rose-600 to-fuchsia-700 py-16 text-center text-white sm:py-20">
        <div className="mx-auto max-w-2xl px-5">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to meet someone new?</h2>
          <p className="mt-3 text-white/90">Join free in less than a minute and start a live chat right away.</p>
          <Link
            href={primaryHref}
            className="mt-7 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-bold text-rose-600 shadow-lg transition hover:bg-rose-50"
          >
            {primaryLabel}
          </Link>
        </div>
      </section>

      <footer className="relative border-t border-white/5 py-8 text-center text-sm text-slate-600">
        © {new Date().getFullYear()} Singles. Made for real-time connections.
      </footer>
    </main>
  );
}
