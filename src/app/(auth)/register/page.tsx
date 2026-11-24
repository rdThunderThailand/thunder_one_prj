import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth";

export const metadata: Metadata = { title: "สมัครใช้งาน" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-6 text-lg font-semibold text-foreground">
        Create your account
      </h1>
      <RegisterForm />
    </>
  );
}
