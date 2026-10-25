import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/chat");

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-4 py-12">
      <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-rose-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-[120px]" />
      <AuthForm mode="signup" />
    </main>
  );
}
