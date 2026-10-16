import type { Metadata } from "next";
import { SetPasswordForm } from "@/features/auth";

export const metadata: Metadata = { title: "ตั้งรหัสผ่าน" };

// Where Supabase's invite email (Add Employee flow) redirects to — reads
// the access_token from the URL fragment client-side, see SetPasswordForm.
export default function SetPasswordPage() {
  return (
    <>
      <h1 className="mb-6 text-lg font-semibold text-foreground">
        Set your password
      </h1>
      <SetPasswordForm />
    </>
  );
}
