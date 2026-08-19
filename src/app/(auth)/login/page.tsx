import { LoginForm } from "@/features/auth";

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Sign in to your workspace
      </h1>
      <LoginForm />
    </>
  );
}
