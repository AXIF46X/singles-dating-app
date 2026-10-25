import { redirect } from "next/navigation";
import { getCurrentUserWithProfile } from "@/lib/auth";
import ChatThread from "./ChatThread";

export default async function MatchChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const data = await getCurrentUserWithProfile();
  if (!data) redirect("/login");
  if (!data.profile) redirect("/onboarding");

  const { matchId } = await params;

  return (
    <div className="mx-auto max-w-2xl">
      <ChatThread matchId={matchId} currentUserId={data.user.id} />
    </div>
  );
}
