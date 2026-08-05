"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SocialProvider = "google" | "github";

export function LoginForm({
  socialProviders = [],
}: {
  socialProviders?: SocialProvider[];
}) {
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
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    // Finish profile if signup created Auth but never wrote the app User row
    if (data.session) {
      const meta = data.user?.user_metadata ?? {};
      const username =
        typeof meta.username === "string" && meta.username.length >= 3
          ? meta.username
          : `user_${data.user!.id.slice(0, 8)}`;
      const phone = typeof meta.phone === "string" ? meta.phone : undefined;
      await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        credentials: "include",
        body: JSON.stringify({ username, ...(phone && { phone }) }),
      });
    }
    setLoading(false);
    router.push(next);
    router.refresh();
  }

  async function oauth(provider: SocialProvider) {
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
      setError(
        err?.message ??
          "Guest sign-in failed — enable Anonymous in Supabase Auth",
      );
      return;
    }
    const username = `guest_${data.user.id.slice(0, 6)}`;
    const token = data.session?.access_token;
    await fetch("/api/auth/complete-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ username }),
    });
    setLoading(false);
    router.push(next);
    router.refresh();
  }

  const labels: Record<SocialProvider, string> = {
    google: "Google",
    github: "GitHub",
  };

  return (
    <div className="glass-card mx-auto w-full max-w-md space-y-6 rounded-2xl p-6 md:p-8">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-2 text-muted">
          Log in to host rooms or join your buddy.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-surface-low px-3 py-2.5 text-foreground focus:border-cinema-red/50 focus:outline-none"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-surface-low px-3 py-2.5 text-foreground focus:border-cinema-red/50 focus:outline-none"
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-cinema w-full rounded-xl py-2.5 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>

      {socialProviders.length > 0 && (
        <div className="flex gap-2">
          {socialProviders.map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => void oauth(provider)}
              className="btn-glass flex-1 rounded-xl py-2 text-sm"
            >
              {labels[provider]}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => void guestJoin()}
        className="w-full text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
      >
        Continue as guest
      </button>
      <p className="text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-semibold text-cinema-red hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
