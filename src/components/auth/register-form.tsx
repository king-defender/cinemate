"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { username },
      },
    });

    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }

    // Email confirmation ON → no session yet; profile is created after verify/login.
    if (data.session) {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setLoading(false);
        setError(body?.error?.message ?? "Could not save profile");
        return;
      }
      setLoading(false);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setLoading(false);
    setInfo(
      "Account created. Check your email for a verification link, then log in.",
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide text-cream">Join CineMate</h1>
        <p className="mt-2 text-cream/55">
          Create an account to host rooms and find movie buddies.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="text-cream/70">Username</span>
          <input
            required
            minLength={3}
            maxLength={24}
            pattern="[a-zA-Z0-9_]+"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-cream/15 bg-ink-900 px-3 py-2.5 text-cream focus:border-amber-500/50 focus:outline-none"
          />
        </label>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-cream/15 bg-ink-900 px-3 py-2.5 text-cream focus:border-amber-500/50 focus:outline-none"
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        {info && <p className="text-sm text-emerald-300">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 py-2.5 font-medium text-ink-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="text-sm text-cream/45">
        Already have an account?{" "}
        <Link href="/login" className="text-amber-400 hover:text-amber-300">
          Log in
        </Link>
      </p>
    </div>
  );
}
