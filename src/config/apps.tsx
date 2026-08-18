// Registry of apps served by this shell. The URL (`basePath`) is the source of
// truth for which app is active — see docs/adr/0016-app-switcher-multi-app-shell.md.
// Add a new app by adding an entry here; Sidebar reads this list, it does not
// hardcode app names.
import type { ReactNode } from "react";
import { BoxIcon, GridIcon } from "@/components/ui/icons";

export interface AppConfig {
  id: string;
  label: string;
  tagline: string;
  icon: ReactNode;
  basePath: string;
}

export const APPS: AppConfig[] = [
  {
    id: "media-workspace",
    label: "Media Workspace",
    tagline: "Communication OS",
    icon: <GridIcon className="h-4 w-4" />,
    basePath: "/",
  },
  {
    id: "asset-intelligence",
    label: "Asset Intelligence",
    tagline: "Business OS",
    icon: <BoxIcon className="h-4 w-4" />,
    basePath: "/asset-intelligence",
  },
];

// Longest basePath first so `/asset-intelligence/**` is matched before the `/`
// fallback — see the matcher in Sidebar.tsx.
export function resolveActiveApp(pathname: string): AppConfig {
  const sorted = [...APPS].sort((a, b) => b.basePath.length - a.basePath.length);
  return (
    sorted.find((app) => app.basePath !== "/" && pathname.startsWith(app.basePath)) ??
    APPS.find((app) => app.basePath === "/")!
  );
}
