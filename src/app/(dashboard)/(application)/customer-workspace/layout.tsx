import type { Metadata } from "next";

// Only sets the browser-tab title for every page in this App
// ("Customer Workspace | ThunderOne" via the root title template).
export const metadata: Metadata = { title: "Customer Workspace" };

export default function CustomerWorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
