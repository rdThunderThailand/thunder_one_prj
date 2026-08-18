"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { APPS, resolveActiveApp } from "@/config/apps";
import { resolveAssetIntelligenceNav } from "@/config/nav/asset-intelligence";
import { mediaWorkspaceNav } from "@/config/nav/media-workspace";
import type { NavConfig, NavItem, NavSection } from "@/config/nav/types";
import { ChevronDownIcon, LayoutIcon, LightningIcon } from "@/components/ui/icons";

// Media Workspace has one nav for the whole app; Asset Intelligence has one nav
// per persona, resolved from the route (see config/nav/asset-intelligence.tsx).
function resolveNavConfig(appId: string, pathname: string): NavConfig {
  if (appId === "asset-intelligence") return resolveAssetIntelligenceNav(pathname);
  return mediaWorkspaceNav;
}

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
      className={`${baseClasses} ${active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
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
      className={`${baseClasses} ${active ? "text-white font-medium" : "text-slate-400 hover:text-white"
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

function AppSwitcher({ activeAppId }: { activeAppId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const activeApp = APPS.find((app) => app.id === activeAppId) ?? APPS[0];

  return (
    <div className="relative mx-3 mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        <span className="flex items-center gap-2">
          {activeApp.icon}
          {activeApp.label}
        </span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-white/10 bg-[#0b1220] shadow-lg"
        >
          {APPS.map((app) => (
            <button
              key={app.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                router.push(app.basePath);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors ${app.id === activeApp.id
                  ? "bg-white/10 font-semibold text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
            >
              {app.icon}
              {app.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const activeApp = resolveActiveApp(pathname);
  const nav = resolveNavConfig(activeApp.id, pathname);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-[#0b1220]">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-indigo-400 to-blue-600 text-white">
          <LightningIcon className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">ThunderOne</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">{activeApp.tagline}</p>
        </div>
      </div>

      <AppSwitcher activeAppId={activeApp.id} />

      <nav className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        <div>
          <div className="flex items-center gap-2.5 rounded-lg bg-white/10 px-2.5 py-2 text-sm font-semibold text-white">
            {nav.overviewItem.icon}
            <Link href={nav.overviewItem.href!} className="flex-1">
              {nav.overviewItem.label}
            </Link>
          </div>
        </div>

        {nav.sections.map((section) => (
          <SidebarSection key={section.label} section={section} pathname={pathname} />
        ))}

        <div className="space-y-0.5 border-t border-white/10 pt-3">
          {nav.standaloneLinks.map((item, index) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span className="pl-2.5 text-slate-400">{nav.standaloneIcons[index]}</span>
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
