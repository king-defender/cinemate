import { Suspense } from "react";
import { AppNav } from "@/components/app-nav";
import { LoginForm } from "@/components/auth/login-form";
import { getEnabledSocialProviders } from "@/lib/auth-providers";

export default function LoginPage() {
  const socialProviders = getEnabledSocialProviders();

  return (
    <>
      <AppNav />
      <main className="flex flex-1 items-center px-4 py-16">
        <Suspense fallback={<div className="mx-auto text-cream/40">Loading…</div>}>
          <LoginForm socialProviders={socialProviders} />
        </Suspense>
      </main>
    </>
  );
}
