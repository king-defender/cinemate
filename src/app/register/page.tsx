import { AppNav } from "@/components/app-nav";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <>
      <AppNav />
      <main className="flex flex-1 items-center px-4 py-16">
        <RegisterForm />
      </main>
    </>
  );
}
