"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/schemas";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const parsed = registerSchema.safeParse({
      email,
      password,
      username,
      phone,
    });
    if (!parsed.success) {
      setLoading(false);
      setError(parsed.error.issues[0]?.message ?? "Invalid details");
      return;
    }

    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          username: parsed.data.username,
          phone: parsed.data.phone,
        },
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
        body: JSON.stringify({
          username: parsed.data.username,
          phone: parsed.data.phone,
        }),
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
    <div className="glass-card mx-auto w-full max-w-md space-y-6 rounded-2xl p-6 md:p-8">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
          Join CineMate
        </h1>
        <p className="mt-2 text-muted">
          Create an account to host rooms and find movie buddies.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Username</span>
          <input
            required
            minLength={3}
            maxLength={24}
            pattern="[a-zA-Z0-9_]+"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-surface-low px-3 py-2.5 text-foreground focus:border-cinema-red/50 focus:outline-none"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Phone number</span>
          <input
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-surface-low px-3 py-2.5 text-foreground placeholder:text-muted/50 focus:border-cinema-red/50 focus:outline-none"
          />
        </label>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-surface-low px-3 py-2.5 text-foreground focus:border-cinema-red/50 focus:outline-none"
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        {info && <p className="text-sm text-success">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-cinema w-full rounded-xl py-2.5 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-cinema-red hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
