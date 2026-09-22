// Thunder One's shell-level nav — rendered when the active route belongs to
// no App (Sidebar.tsx falls back to this when config/apps.tsx's
// resolveActiveApp returns null). 3 items shown (Intelligence/Governance
// hidden 2026-09-16, see the commented-out entries below) — docs/adr/0033-
// thunder-one-shell-launcher-not-dropdown.md.
import type { ReactNode } from "react";
// SettingsIcon/SparklesIcon back these two commented-out nav entries —
// re-import them if Intelligence/Governance come back.
import { CheckSquareIcon, GridIcon, HomeIcon } from "@/components/ui/icons";

export interface ShellNavItem {
  label: string;
  sublabel: string;
  href: string;
  icon: ReactNode;
  /** Shows a small count pill next to the label. Placeholder — no cross-App
   * task aggregation exists yet (My Work's own page says as much). */
  badge?: number;
  /** Purely decorative affordance for items that lead to a chooser (Workspaces). */
  chevron?: boolean;
}

export const shellNavItems: ShellNavItem[] = [
  {
    // 2026-09-16 shell redesign — label/sublabel relabeled to the mockup's
    // Thai copy ("หน้าแรก / ภาพรวม"); href unchanged, still Mission Control's
    // route (this page's own content was redesigned to match, not moved).
    label: "หน้าแรก",
    sublabel: "ภาพรวม",
    href: "/mission-control",
    icon: <HomeIcon className="h-4 w-4 shrink-0" />,
  },
  {
    label: "งานของฉัน",
    sublabel: "งานและการอนุมัติ",
    href: "/my-work",
    icon: <CheckSquareIcon className="h-4 w-4 shrink-0" />,
    badge: 3,
  },
  {
    label: "พื้นที่ทำงาน",
    sublabel: "เข้าถึงทุกระบบของคุณ",
    href: "/work-space",
    icon: <GridIcon className="h-4 w-4 shrink-0" />,
    chevron: true,
  },
  // 2026-09-16 — Intelligence/Governance hidden from the shell nav to match
  // the Figma mockup exactly (it only shows these 3 items). The routes and
  // pages themselves are untouched; this is a nav-visibility decision only,
  // easy to restore by uncommenting once there's a call on bringing them
  // back.
  // {
  //   label: "Intelligence",
  //   sublabel: "Insights & Analytics",
  //   href: "/intelligence",
  //   icon: <SparklesIcon className="h-4 w-4 shrink-0" />,
  // },
  // {
  //   label: "Governance",
  //   sublabel: "Governance & Control",
  //   href: "/governance",
  //   icon: <SettingsIcon className="h-4 w-4 shrink-0" />,
  // },
];
