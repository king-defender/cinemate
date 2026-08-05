"use client";

import { FormEvent, useState } from "react";
import { AppNav } from "@/components/app-nav";

type User = {
  username: string;
  bio: string | null;
  favoriteGenres: string[];
  country: string | null;
};

export function SettingsClient({ user }: { user: User }) {
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio ?? "");
  const [genres, setGenres] = useState(user.favoriteGenres.join(", "));
  const [country, setCountry] = useState(user.country ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        bio: bio || null,
        country: country || null,
        favoriteGenres: genres
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? "Update failed");
      return;
    }
    setMessage("Saved");
  }

  return (
    <>
      <AppNav username={user.username} />
      <main className="mx-auto max-w-lg flex-1 px-4 py-12">
        <h1 className="font-display text-4xl tracking-wide text-cream">
          Settings
        </h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="text-cream/70">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-cream/15 bg-ink-900 px-3 py-2.5 text-cream focus:border-amber-500/50 focus:outline-none"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-cream/70">Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={280}
              className="w-full border border-cream/15 bg-ink-900 px-3 py-2.5 text-cream focus:border-amber-500/50 focus:outline-none"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-cream/70">Favorite genres (comma-separated)</span>
            <input
              value={genres}
              onChange={(e) => setGenres(e.target.value)}
              className="w-full border border-cream/15 bg-ink-900 px-3 py-2.5 text-cream focus:border-amber-500/50 focus:outline-none"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-cream/70">Country</span>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border border-cream/15 bg-ink-900 px-3 py-2.5 text-cream focus:border-amber-500/50 focus:outline-none"
            />
          </label>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}
          <button
            type="submit"
            className="bg-amber-500 px-5 py-2.5 font-medium text-ink-950 hover:bg-amber-400"
          >
            Save
          </button>
        </form>
      </main>
    </>
  );
}
