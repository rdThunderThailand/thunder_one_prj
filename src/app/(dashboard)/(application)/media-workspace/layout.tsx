import type { Metadata } from "next";
import { requireAppAccess } from "@/config/tenant-access";
import { getSession } from "@/features/auth/services/get-session";
import { MediaWorkspaceLayout } from "@/features/media-workspace/media-workspace-layout";

export const metadata: Metadata = { title: "Media Workspace" };

// Gated like every other App now that a super admin can switch Media Workspace
// off for a tenant (config/tenant-access.ts).
export default async function MediaWorkspaceRouteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  requireAppAccess(await getSession(), "media-workspace");
  return <MediaWorkspaceLayout>{children}</MediaWorkspaceLayout>;
}
