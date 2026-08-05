import { Suspense } from "react";
import { AppNav } from "@/components/app-nav";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <>
      <AppNav />
      <main className="flex flex-1 items-center px-4 py-16">
        <Suspense fallback={<div className="mx-auto text-cream/40">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </>
  );
}
