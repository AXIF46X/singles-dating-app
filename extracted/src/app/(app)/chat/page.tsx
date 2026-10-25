import { redirect } from "next/navigation";
import { getCurrentUserWithProfile } from "@/lib/auth";
import ChatRoom from "./ChatRoom";

export default async function ChatPage() {
  const data = await getCurrentUserWithProfile();
  if (!data) redirect("/login");
  if (!data.profile) redirect("/onboarding");

  return (
    <ChatRoom
      currentUserId={data.user.id}
      myName={data.profile.name}
      myPhotoUrl={data.profile.photoUrl}
    />
  );
}
