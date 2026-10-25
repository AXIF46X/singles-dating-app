import { redirect } from "next/navigation";
import { getCurrentUserWithProfile } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const data = await getCurrentUserWithProfile();
  if (!data) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Your profile</h1>
        <p className="mt-2 text-slate-400">Signed in as {data.user.email}</p>
      </div>
      <ProfileForm
        seedKey={data.user.id}
        initialValues={
          data.profile
            ? {
                name: data.profile.name,
                age: String(data.profile.age),
                gender: data.profile.gender,
                lookingFor: data.profile.lookingFor,
                location: data.profile.location,
                bio: data.profile.bio,
                interests: data.profile.interests,
                photoUrl: data.profile.photoUrl,
              }
            : { name: data.user.email.split("@")[0] }
        }
        submitLabel="Save changes"
        redirectTo="/profile"
      />
    </div>
  );
}
