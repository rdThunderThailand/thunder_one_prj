import type { Metadata } from "next";
import { requireAppAccess } from "@/config/tenant-access";
import { getSession } from "@/features/auth/services/get-session";

// Sets the browser-tab title for every page in this App
// ("ThunderCare | ThunderOne" via the root title template). A tenant without this
// App switched on is sent to an App it may open instead (config/tenant-access.ts).
export const metadata: Metadata = { title: "ThunderCare" };

export default async function ThunderCareLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  requireAppAccess(await getSession(), "thunder-care");
  return children;
}
