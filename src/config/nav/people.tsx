// People Workspace's sidebar nav (HR Manager persona — the only one this
// sprint). One flat nav for the whole app, same shape as Media Workspace's
// (config/nav/media-workspace.tsx), not per-persona like Asset Intelligence's
// — People Workspace has a single "HR Manager" audience so far, no route-based
// persona switch needed yet.
//
// Every item below is built except ติดต่อ HR (Contact HR) — no mockup for
// that one exists yet, so it's intentionally left without an `href` — same
// "renders inert, not built yet" convention as NavItem's own doc comment and
// every other App's nav config (e.g. Asset Intelligence's employeeNav "Help"
// item).
import { ClipboardIcon, HomeIcon, UsersIcon } from "@/components/ui/icons";
import type { NavConfig, NavItem } from "./types";

export const peopleNav: NavConfig = {
  overviewItem: {
    label: "ภาพรวม",
    href: "/people",
    icon: <HomeIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [
    {
      label: "บุคลากร",
      icon: <UsersIcon />,
      items: [
        { label: "บุคลากร", href: "/people/personnel" },
        { label: "โครงสร้างองค์กร", href: "/people/org-structure" },
        { label: "เข้าใหม่", href: "/people/new-hires" },
        { label: "การเปลี่ยนแปลง", href: "/people/changes" },
        { label: "ออกจากองค์กร", href: "/people/departures" },
      ] satisfies NavItem[],
    },
    {
      label: "นโยบายและความรู้",
      icon: <ClipboardIcon />,
      items: [
        { label: "นโยบาย", href: "/people/policy" },
        { label: "คลังความรู้", href: "/people/knowledge-base" },
        { label: "ติดต่อ HR" },
      ] satisfies NavItem[],
    },
  ],
  standaloneLinks: [],
  standaloneIcons: [],
};
