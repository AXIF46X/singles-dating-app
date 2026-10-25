import { redirect } from "next/navigation";
import { getCurrentUserWithProfile } from "@/lib/auth";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const data = await getCurrentUserWithProfile();
  if (!data) redirect("/login");
  if (data.profile) redirect("/chat");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Build your Singles profile</h1>
        <p className="mt-2 text-slate-400">
          This is what potential matches will see after a chat. You can update it anytime.
        </p>
      </div>
      <OnboardingForm email={data.user.email} userId={data.user.id} />
    </div>
  );
}
