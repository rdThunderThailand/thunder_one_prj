// Sidebar shown on /profile and /account-security instead of the regular
// shell/app nav — a dedicated settings section, matching the Figma
// account-settings mockup. "การตั้งค่าส่วนบุคคล" deep-links to /profile
// (same target UserMenu.tsx's own entry uses) since Core has no separate
// app-settings endpoint to back a standalone page — see ProfilePage's
// "รูปแบบการแสดงผล" card, which is what it actually lands on.
import type { ReactNode } from "react";
import { LockIcon, SettingsIcon, UserIcon } from "@/components/ui/icons";

export interface SettingsNavItem {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
}

export const settingsNavItems: SettingsNavItem[] = [
  {
    id: "profile",
    label: "โปรไฟล์ของฉัน",
    href: "/profile",
    icon: <UserIcon className="h-4 w-4 shrink-0" />,
  },
  {
    id: "account-security",
    label: "บัญชีและความปลอดภัย",
    href: "/account-security",
    icon: <LockIcon className="h-4 w-4 shrink-0" />,
  },
  {
    id: "settings",
    label: "การตั้งค่าส่วนบุคคล",
    href: "/profile",
    icon: <SettingsIcon className="h-4 w-4 shrink-0" />,
  },
];
