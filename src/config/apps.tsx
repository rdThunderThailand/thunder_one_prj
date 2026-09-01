// Registry of Apps reached from inside Thunder One's shell. The URL
// (`basePath`) is the source of truth for which App is active — see
// docs/adr/0022-app-switcher-multi-app-shell.md. Add a new App by adding an
// entry here; Sidebar reads this list, it does not hardcode App names.
//
// No App owns "/" — that belongs to Thunder One's shell root since
// docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md. resolveActiveApp
// returns null there (and on other shell-level routes like /mission-control,
// /my-work, /work-space, /intelligence, /governance), and Sidebar falls back
// to config/nav/shell.tsx's nav in that case.
import type { ReactNode } from "react";
import { BoxIcon, GridIcon, PhoneIcon, UsersIcon } from "@/components/ui/icons";

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
    tagline: "Media Workspace OS",
    icon: <GridIcon className="h-4 w-4" />,
    basePath: "/media-workspace",
  },
  {
    id: "asset-intelligence",
    label: "Asset Intelligence",
    tagline: "Asset Workspace",
    icon: <BoxIcon className="h-4 w-4" />,
    basePath: "/asset-intelligence",
  },
  {
    id: "thunder-care",
    label: "ThunderCare",
    tagline: "Service OS",
    icon: <PhoneIcon className="h-4 w-4" />,
    basePath: "/thunder-care",
  },
  {
    id: "people",
    label: "People",
    tagline: "People Workspace",
    icon: <UsersIcon className="h-4 w-4" />,
    basePath: "/people",
  },
];

// Longest basePath first so a more specific App wins over a shorter prefix
// that happens to also match — see the matcher in Sidebar.tsx. Returns null
// when pathname belongs to no App (Thunder One's shell owns it instead).
export function resolveActiveApp(pathname: string): AppConfig | null {
  const sorted = [...APPS].sort((a, b) => b.basePath.length - a.basePath.length);
  return sorted.find((app) => pathname.startsWith(app.basePath)) ?? null;
}
