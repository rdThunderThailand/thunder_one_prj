// Thunder One's shell-level nav — rendered when the active route belongs to
// no App (Sidebar.tsx falls back to this when config/apps.tsx's
// resolveActiveApp returns null). Flat, 5 items, same list on every shell
// route (Mission Control's former Insights/Reports/Approvals sub-nav was
// dropped — those pages are still reachable from Mission Control's own page
// content) — docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md.
import type { ReactNode } from "react";
import { GridIcon, HomeIcon, ListIcon, SettingsIcon, SparklesIcon } from "@/components/ui/icons";

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
    icon: <ListIcon className="h-4 w-4 shrink-0" />,
    badge: 3,
  },
  {
    label: "Intelligence",
    sublabel: "Insights & Analytics",
    href: "/intelligence",
    icon: <SparklesIcon className="h-4 w-4 shrink-0" />,
  },
  {
    label: "พื้นที่ทำงาน",
    sublabel: "เข้าถึงทุกระบบของคุณ",
    href: "/work-space",
    icon: <GridIcon className="h-4 w-4 shrink-0" />,
    chevron: true,
  },
  {
    label: "Governance",
    sublabel: "Governance & Control",
    href: "/governance",
    icon: <SettingsIcon className="h-4 w-4 shrink-0" />,
  },
];
