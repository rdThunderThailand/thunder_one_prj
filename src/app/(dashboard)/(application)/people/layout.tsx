import type { Metadata } from "next";
import { requireAppAccess } from "@/config/tenant-access";
import { getSession } from "@/features/auth/services/get-session";

// Sets the browser-tab title for every page in this App
// ("People Workspace | ThunderOne" via the root title template). A tenant without this
// App switched on is sent to an App it may open instead (config/tenant-access.ts).
export const metadata: Metadata = { title: "People Workspace" };

export default async function PeopleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  requireAppAccess(await getSession(), "people");
  return children;
}
