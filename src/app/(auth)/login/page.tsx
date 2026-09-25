import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth";

// The only page search engines may index (robots.ts), so it carries the full
// brand title, the same as the marketing site's tab, not "เข้าสู่ระบบ | ThunderOne".
export const metadata: Metadata = {
  title: { absolute: "ThunderOne | Empowered People. Connected Organization." },
  alternates: { canonical: "/login" },
};

// LoginForm reads `?next=` via useSearchParams(), which opts this page out of
// static prerendering unless wrapped in Suspense — Next.js's build fails
// without this boundary ("useSearchParams() should be wrapped in a suspense
// boundary").
export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Sign in to your workspace
      </h1>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </>
  );
}
