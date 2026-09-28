// Customer Workspace's sidebar nav — one flat nav for the whole app (no
// persona split, same shape as People/Media Workspace's own single nav).
// Matches the mockup's sidebar exactly: 4 flat items, no section grouping —
// standaloneLinks (not `sections`) is the only way this app's shared
// Sidebar.tsx renders a header-less flat list.
import { HomeIcon, RepeatIcon, SettingsIcon, UsersIcon } from "@/components/ui/icons";
import type { NavConfig } from "./types";

export const customerWorkspaceNav: NavConfig = {
  overviewItem: {
    label: "ภาพรวม",
    href: "/customer-workspace",
    icon: <HomeIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [],
  standaloneLinks: [
    { label: "ลูกค้า", href: "/customer-workspace/customers" },
    { label: "การต่ออายุ", href: "/customer-workspace/renewals" },
    { label: "ตั้งค่าพื้นที่ทำงาน", href: "/customer-workspace/settings" },
  ],
  standaloneIcons: [<UsersIcon key="customers" />, <RepeatIcon key="renewals" />, <SettingsIcon key="settings" />],
};
