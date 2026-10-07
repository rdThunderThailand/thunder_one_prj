import type { Metadata } from "next";

// Public Help Center (Help Spec HLP-001–003, HLP-005–008). Deliberately outside the (dashboard)
// group: no getSession(), no Sidebar/Topbar — Public Help works without the Identity service
// (D-G7-01). src/proxy.ts lets /help through without a session cookie.
export const metadata: Metadata = {
  title: { default: "Help Center", template: "%s | Help Center | ThunderOne" },
  description: "ThunderOne guides, troubleshooting and reference.",
};

export default function HelpLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
