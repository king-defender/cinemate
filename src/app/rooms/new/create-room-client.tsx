"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { WATCH_PLATFORMS, type PlatformId } from "@/lib/platforms";

export function CreateRoomClient({ username }: { username: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<PlatformId | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || undefined,
        platform: platform || undefined,
      }),
    });
    const body = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(body?.error?.message ?? "Could not create room");
      return;
    }
    router.push(`/rooms/${body.id}`);
  }

  return (
    <>
      <AppNav username={username} />
      <main className="mx-auto max-w-lg flex-1 px-4 py-16">
        <h1 className="font-display text-4xl tracking-wide text-cream">
          New room
        </h1>
        <p className="mt-2 text-cream/55">
          Private by default — share the invite link; you approve who enters.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="text-cream/70">Title (optional)</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Friday night horror"
              className="w-full border border-cream/15 bg-ink-900 px-3 py-2.5 text-cream focus:border-amber-500/50 focus:outline-none"
            />
          </label>
          <fieldset className="space-y-2">
            <legend className="text-sm text-cream/70">Watching on</legend>
            <div className="flex flex-wrap gap-2">
              {WATCH_PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={
                    platform === p.id
                      ? "bg-amber-500 px-3 py-1.5 text-sm font-medium text-ink-950"
                      : "border border-cream/15 px-3 py-1.5 text-sm text-cream/70"
                  }
                >
                  {p.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-cream/40">
              Opens as a companion link — CineMate does not embed Netflix/Hotstar.
            </p>
          </fieldset>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 py-2.5 font-medium text-ink-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create room"}
          </button>
        </form>
      </main>
    </>
  );
}
