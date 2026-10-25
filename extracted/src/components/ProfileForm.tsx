"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GENDER_OPTIONS, INTEREST_OPTIONS, LOOKING_FOR_OPTIONS } from "@/lib/constants";

type ProfileFormValues = {
  name: string;
  age: string;
  gender: string;
  lookingFor: string;
  location: string;
  bio: string;
  interests: string[];
  photoUrl: string;
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-rose-400/60 focus:outline-none focus:ring-2 focus:ring-rose-500/20";

export default function ProfileForm({
  seedKey,
  initialValues,
  submitLabel = "Save and continue",
  redirectTo = "/chat",
}: {
  seedKey: string;
  initialValues?: Partial<ProfileFormValues>;
  submitLabel?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProfileFormValues>({
    name: initialValues?.name ?? "",
    age: initialValues?.age ?? "",
    gender: initialValues?.gender ?? GENDER_OPTIONS[0],
    lookingFor: initialValues?.lookingFor ?? LOOKING_FOR_OPTIONS[0],
    location: initialValues?.location ?? "",
    bio: initialValues?.bio ?? "",
    interests: initialValues?.interests ?? [],
    photoUrl:
      initialValues?.photoUrl ?? `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(seedKey)}`,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleInterest(interest: string) {
    setValues((prev) => {
      const has = prev.interests.includes(interest);
      if (has) {
        return { ...prev, interests: prev.interests.filter((item) => item !== interest) };
      }
      if (prev.interests.length >= 8) return prev;
      return { ...prev, interests: [...prev.interests, interest] };
    });
  }

  function randomizePhoto() {
    const seed = Math.random().toString(36).slice(2);
    setValues((prev) => ({ ...prev, photoUrl: `https://api.dicebear.com/9.x/notionists/png?seed=${seed}` }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!values.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    const ageNum = Number(values.age);
    if (!ageNum || ageNum < 18 || ageNum > 120) {
      setError("Please enter a valid age (18+).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl bg-white/5 p-6 shadow-2xl shadow-rose-950/20 ring-1 ring-white/10 backdrop-blur sm:p-8"
    >
      {error && (
        <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300 ring-1 ring-rose-500/30">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={values.photoUrl}
          alt="Profile preview"
          className="h-28 w-28 rounded-full border-4 border-slate-900 object-cover shadow-lg ring-1 ring-white/20"
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={randomizePhoto}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
          >
            🎲 Shuffle avatar
          </button>
          <input
            type="url"
            placeholder="Or paste a photo URL"
            value={values.photoUrl}
            onChange={(e) => setValues((prev) => ({ ...prev, photoUrl: e.target.value }))}
            className="w-56 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-500 focus:border-rose-400/60 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-300">First name</label>
          <input
            value={values.name}
            onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
            className={inputClass}
            placeholder="Alex"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-300">Age</label>
          <input
            type="number"
            min={18}
            max={120}
            value={values.age}
            onChange={(e) => setValues((prev) => ({ ...prev, age: e.target.value }))}
            className={inputClass}
            placeholder="27"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-300">I am a</label>
          <select
            value={values.gender}
            onChange={(e) => setValues((prev) => ({ ...prev, gender: e.target.value }))}
            className={`${inputClass} [&>option]:bg-slate-900`}
          >
            {GENDER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-300">Interested in</label>
          <select
            value={values.lookingFor}
            onChange={(e) => setValues((prev) => ({ ...prev, lookingFor: e.target.value }))}
            className={`${inputClass} [&>option]:bg-slate-900`}
          >
            {LOOKING_FOR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-300">Location</label>
          <input
            value={values.location}
            onChange={(e) => setValues((prev) => ({ ...prev, location: e.target.value }))}
            className={inputClass}
            placeholder="Austin, TX"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-300">About you</label>
        <textarea
          value={values.bio}
          onChange={(e) => setValues((prev) => ({ ...prev, bio: e.target.value }))}
          rows={4}
          maxLength={600}
          className={`${inputClass} resize-none`}
          placeholder="Tell potential matches a bit about yourself..."
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-300">
          Interests <span className="font-normal text-slate-500">(pick up to 8)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const active = values.interests.includes(interest);
            return (
              <button
                type="button"
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "border-transparent bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-950/40"
                    : "border-white/15 bg-white/5 text-slate-300 hover:border-rose-400/40 hover:text-rose-300"
                }`}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-rose-950/40 transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
