import type { Metadata } from "next";
import { requireAppAccess } from "@/config/tenant-access";
import { getSession } from "@/features/auth/services/get-session";

// Sets the browser-tab title for every page in this App
// ("Asset Workspace | ThunderOne" via the root title template). Behind the
// NEXT_PUBLIC_ASSET_WORKSPACE_MVP flag until release — gated in src/proxy.ts
// (docs/adr/0097). Tenants other than the owner are sent to Media Workspace
// instead (config/tenant-access.ts).
export const metadata: Metadata = { title: "Asset Workspace" };

export default async function AssetWorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  requireAppAccess(await getSession(), "asset-workspace");
  return children;
}
