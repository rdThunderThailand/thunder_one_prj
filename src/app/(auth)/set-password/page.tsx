import { SetPasswordForm } from "@/features/auth";

// Where Supabase's invite email (Add Employee flow) redirects to — reads
// the access_token from the URL fragment client-side, see SetPasswordForm.
export default function SetPasswordPage() {
  return (
    <>
      <h1 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Set your password
      </h1>
      <SetPasswordForm />
    </>
  );
}
