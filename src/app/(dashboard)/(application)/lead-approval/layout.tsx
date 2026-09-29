import type { Metadata } from "next";
import { requireAppAccess } from "@/config/tenant-access";
import { getSession } from "@/features/auth/services/get-session";

// Sets the browser-tab title for every page in this App
// ("Lead Approval | ThunderOne" via the root title template). Tenants other than the
// owner are sent to Media Workspace instead (config/tenant-access.ts).
export const metadata: Metadata = { title: "Lead Approval" };

export default async function LeadApprovalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  requireAppAccess(await getSession(), "lead-approval");
  return children;
}
