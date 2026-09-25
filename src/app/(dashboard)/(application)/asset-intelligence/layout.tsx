import type { Metadata } from "next";

// Only sets the browser-tab title for every page in this App
// ("Asset Intelligence | ThunderOne" via the root title template).
export const metadata: Metadata = { title: "Asset Intelligence" };

export default function AssetIntelligenceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
