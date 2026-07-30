import { RegisterForm } from "@/features/auth";

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Create your account
      </h1>
      <RegisterForm />
    </>
  );
}
