import type { Metadata } from "next";
import { requireAppAccess } from "@/config/tenant-access";
import { getSession } from "@/features/auth/services/get-session";

// Sets the browser-tab title for every page in this App
// ("People Workspace | ThunderOne" via the root title template). Tenants other than the
// owner are sent to Media Workspace instead (config/tenant-access.ts).
export const metadata: Metadata = { title: "People Workspace" };

export default async function PeopleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  requireAppAccess(await getSession(), "people");
  return children;
}
