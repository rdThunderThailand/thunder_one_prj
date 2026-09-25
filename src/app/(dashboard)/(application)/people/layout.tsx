import type { Metadata } from "next";

// Only sets the browser-tab title for every page in this App
// ("People Workspace | ThunderOne" via the root title template).
export const metadata: Metadata = { title: "People Workspace" };

export default function PeopleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
