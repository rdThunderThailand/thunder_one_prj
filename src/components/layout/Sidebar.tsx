"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  BroadcastIcon,
  ChartIcon,
  ChevronDownIcon,
  GridIcon,
  LayoutIcon,
  LightningIcon,
  MonitorIcon,
  SettingsIcon,
} from "@/components/ui/icons";

interface NavItem {
  label: string;
  href?: string; // omit for routes not built yet — renders inert
}

interface NavSection {
  label: string;
  icon: ReactNode;
  items: NavItem[];
}

const overviewItem: NavItem = { label: "Overview", href: "/" };

const sections: NavSection[] = [
  {
    label: "Publishing",
    icon: <BroadcastIcon />,
    items: [
      { label: "Now & Next" },
      { label: "Calendar" },
      { label: "Campaigns" },
      { label: "Playlists", href: "/playlists" },
    ],
  },
  {
    label: "Channels",
    icon: <GridIcon />,
    items: [
      { label: "All Channels", href: "/channels" },
      { label: "DOOH" },
      { label: "In-Store" },
      { label: "Online" },
      { label: "Social" },
      { label: "Other" },
    ],
  },
  {
    label: "Monitoring",
    icon: <MonitorIcon />,
    items: [{ label: "Live View" }, { label: "Alerts" }, { label: "System Health" }],
  },
];

const standaloneLinks: NavItem[] = [{ label: "Reports & Analytics" }, { label: "Settings" }];

const standaloneIcons: ReactNode[] = [<ChartIcon key="reports" />, <SettingsIcon key="settings" />];

function TopLevelLink({ item, active }: { item: NavItem; active: boolean }) {
  const baseClasses = "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors";

  if (!item.href) {
    return (
      <span className={`${baseClasses} cursor-not-allowed text-white/25`} title="Not built yet">
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={`${baseClasses} ${
        active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      {item.label}
    </Link>
  );
}

function SubLink({ item, active }: { item: NavItem; active: boolean }) {
  const baseClasses =
    "flex items-center gap-2 rounded-lg py-1.5 pl-8 pr-2.5 text-sm transition-colors";

  if (!item.href) {
    return (
      <span className={`${baseClasses} cursor-not-allowed text-white/20`} title="Not built yet">
        <span className="h-1 w-1 rounded-full bg-current" />
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={`${baseClasses} ${
        active ? "text-white font-medium" : "text-slate-400 hover:text-white"
      }`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {item.label}
    </Link>
  );
}

function SidebarSection({ section, pathname }: { section: NavSection; pathname: string }) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/5"
      >
        <span className="h-4 w-4 shrink-0">{section.icon}</span>
        <span className="flex-1 text-left">{section.label}</span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {section.items.map((item) => (
            <SubLink key={item.label} item={item} active={!!item.href && pathname === item.href} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-[#0b1220]">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-blue-600 text-white">
          <LightningIcon className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">ThunderOne</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Communication OS</p>
        </div>
      </div>

      <button className="mx-3 mb-2 flex items-center justify-between gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
        <span className="flex items-center gap-2">
          <GridIcon className="h-4 w-4" />
          Media Workspace
        </span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      <nav className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        <div>
          <div className="flex items-center gap-2.5 rounded-lg bg-white/10 px-2.5 py-2 text-sm font-semibold text-white">
            <GridIcon className="h-4 w-4 shrink-0" />
            <Link href={overviewItem.href!} className="flex-1">
              {overviewItem.label}
            </Link>
          </div>
        </div>

        {sections.map((section) => (
          <SidebarSection key={section.label} section={section} pathname={pathname} />
        ))}

        <div className="space-y-0.5 border-t border-white/10 pt-3">
          {standaloneLinks.map((item, index) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span className="pl-2.5 text-slate-400">{standaloneIcons[index]}</span>
              <TopLevelLink item={item} active={!!item.href && pathname === item.href} />
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <LayoutIcon className="h-3.5 w-3.5" />
            Quick Channel Status
          </p>
          <ul className="space-y-1.5 text-xs">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
              </span>
              <span className="font-medium text-white">186</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Warning
              </span>
              <span className="font-medium text-white">12</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Offline
              </span>
              <span className="font-medium text-white">8</span>
            </li>
            <li className="mt-1 flex items-center justify-between border-t border-white/10 pt-1.5">
              <span className="text-slate-400">Total</span>
              <span className="font-semibold text-white">206</span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
