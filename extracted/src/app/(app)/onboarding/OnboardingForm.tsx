"use client";

import ProfileForm from "@/components/ProfileForm";

export default function OnboardingForm({ email, userId }: { email: string; userId: string }) {
  return (
    <ProfileForm
      seedKey={userId}
      initialValues={{ name: email.split("@")[0] }}
      submitLabel="Start meeting singles"
      redirectTo="/chat"
    />
  );
}
