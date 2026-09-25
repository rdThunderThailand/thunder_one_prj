import type { Metadata } from "next";
import { requireShellAccess, resolveShellVariant, resolveRole } from "@/config/rbac";
import { getSession } from "@/features/auth/services/get-session";
import { EmployeeIntelligencePage, IntelligencePage, ManagerIntelligencePage } from "@/features/intelligence";

export const metadata: Metadata = { title: "Intelligence" };

export default async function IntelligenceRoute() {
  const resolved = resolveRole(await getSession());
  requireShellAccess(resolved);

  const variant = resolveShellVariant(resolved);
  if (variant === "manager") {
    return <ManagerIntelligencePage />;
  }
  if (variant === "employee") {
    return <EmployeeIntelligencePage />;
  }

  return <IntelligencePage />;
}
