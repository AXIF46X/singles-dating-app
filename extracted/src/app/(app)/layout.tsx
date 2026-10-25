import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUserWithProfile } from "@/lib/auth";
import NavBar from "@/components/NavBar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const data = await getCurrentUserWithProfile();

  if (!data) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar photoUrl={data.profile?.photoUrl} name={data.profile?.name} />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
