import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function NavBar({
  photoUrl,
  name,
}: {
  photoUrl?: string | null;
  name?: string | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/chat" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-base shadow-lg shadow-rose-950/50">
            💘
          </span>
          <span className="text-lg font-bold tracking-tight text-white">Singles</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/chat"
            className="rounded-full px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-4"
          >
            Chat
          </Link>
          <Link
            href="/matches"
            className="rounded-full px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-4"
          >
            Matches
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-3"
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={name ?? "Your profile"} className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20" />
            ) : (
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs">🙂</span>
            )}
            <span className="hidden sm:inline">Profile</span>
          </Link>
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
