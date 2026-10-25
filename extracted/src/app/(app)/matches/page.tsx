import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { getMatchesForUser } from "@/lib/matches-data";

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function MatchesPage() {
  const data = await getCurrentUserWithProfile();
  if (!data) redirect("/login");
  if (!data.profile) redirect("/onboarding");

  const matches = await getMatchesForUser(data.user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Your matches</h1>
        <p className="mt-1 text-sm text-slate-400">Everyone who liked you back after a live chat, ready to talk.</p>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-3xl bg-white/5 p-10 text-center ring-1 ring-white/10">
          <p className="text-4xl">💌</p>
          <h3 className="mt-3 text-lg font-bold text-white">No matches yet</h3>
          <p className="mt-1 text-sm text-slate-400">Jump into a live chat and like someone to make a match.</p>
          <Link
            href="/chat"
            className="mt-5 inline-block rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-950/40"
          >
            Start a live chat
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {matches.map((item) => (
            <li key={item.matchId}>
              <Link
                href={`/matches/${item.matchId}`}
                className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/[0.07] hover:ring-rose-400/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.profile?.photoUrl}
                  alt={item.profile?.name ?? "Match"}
                  className="h-14 w-14 rounded-full object-cover ring-1 ring-white/10"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white">
                    {item.profile?.name}
                    {item.profile?.age ? `, ${item.profile.age}` : ""}
                  </p>
                  <p className="truncate text-sm text-slate-400">
                    {item.lastMessage ? item.lastMessage.content : "You matched — say hi!"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-slate-500">
                  {timeAgo(new Date(item.lastMessage?.createdAt ?? item.createdAt))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
