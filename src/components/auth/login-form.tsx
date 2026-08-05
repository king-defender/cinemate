"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function oauth(provider: "google" | "github") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  async function guestJoin() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signInAnonymously();
    if (err || !data.user) {
      setLoading(false);
      setError(err?.message ?? "Guest sign-in failed — enable Anonymous in Supabase Auth");
      return;
    }
    const username = `guest_${data.user.id.slice(0, 6)}`;
    await fetch("/api/auth/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    setLoading(false);
    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide text-cream">Welcome back</h1>
        <p className="mt-2 text-cream/55">Log in to host rooms or join your buddy.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="text-cream/70">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-cream/15 bg-ink-900 px-3 py-2.5 text-cream focus:border-amber-500/50 focus:outline-none"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-cream/70">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-cream/15 bg-ink-900 px-3 py-2.5 text-cream focus:border-amber-500/50 focus:outline-none"
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 py-2.5 font-medium text-ink-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => oauth("google")}
          className="flex-1 border border-cream/15 py-2 text-sm text-cream/80 hover:border-cream/30"
        >
          Google
        </button>
        <button
          type="button"
          onClick={() => oauth("github")}
          className="flex-1 border border-cream/15 py-2 text-sm text-cream/80 hover:border-cream/30"
        >
          GitHub
        </button>
      </div>
      <button
        type="button"
        onClick={guestJoin}
        className="w-full text-sm text-cream/50 underline-offset-2 hover:text-cream hover:underline"
      >
        Continue as guest
      </button>
      <p className="text-sm text-cream/45">
        New here?{" "}
        <Link href="/register" className="text-amber-400 hover:text-amber-300">
          Create an account
        </Link>
      </p>
    </div>
  );
}
