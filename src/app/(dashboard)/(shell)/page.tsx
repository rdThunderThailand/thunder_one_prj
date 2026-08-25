import { redirect } from "next/navigation";
import { resolveLandingPage, resolveRole } from "@/config/rbac";
import { getSession } from "@/features/auth/services/get-session";

export default async function ShellRootPage() {
  const resolved = resolveRole(await getSession());
  redirect(resolveLandingPage(resolved));
}
