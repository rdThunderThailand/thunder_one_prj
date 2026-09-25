import type { Metadata } from "next";

// Only sets the browser-tab title for every page in this App
// ("ThunderCare | ThunderOne" via the root title template).
export const metadata: Metadata = { title: "ThunderCare" };

export default function ThunderCareLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
