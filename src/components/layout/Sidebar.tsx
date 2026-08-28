"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { resolveActiveApp } from "@/config/apps";
import { resolveAssetIntelligenceNav } from "@/config/nav/asset-intelligence";
import { mediaWorkspaceNav } from "@/config/nav/media-workspace";
import { shellNavItems } from "@/config/nav/shell";
import { resolveThunderCareNav } from "@/config/nav/thunder-care";
import type { NavConfig, NavItem, NavSection } from "@/config/nav/types";
import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon, ChevronRightIcon } from "@/components/ui/icons";

const SHELL_TAGLINE = "Thunder One Shell";

// Media Workspace has one nav for the whole app; Asset Intelligence and
// ThunderCare each have one nav per persona, resolved from the route (see
// config/nav/asset-intelligence.tsx, config/nav/thunder-care.tsx). A null
// appId means the route belongs to no App — Thunder One's shell nav
// (config/nav/shell.tsx) applies instead — docs/adr/0033.
function resolveAppNavConfig(appId: string, pathname: string): NavConfig {
  if (appId === "asset-intelligence") return resolveAssetIntelligenceNav(pathname);
  if (appId === "thunder-care") return resolveThunderCareNav(pathname);
  return mediaWorkspaceNav;
}

function isActivePath(pathname: string, href?: string) {
  if (!href) return false;
  if (href === "/media-workspace") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavBadge({ badge }: { badge?: string }) {
  if (!badge) return null;

  const isAlert = /^\d+$/.test(badge);
  return (
    <span
      className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
        isAlert ? "bg-red-500 text-white" : "bg-indigo-100 text-indigo-600"
      }`}
    >
      {badge}
    </span>
  );
}

function TopLevelLink({ item, active }: { item: NavItem; active: boolean }) {
  const baseClasses =
    "flex min-h-9 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors";
  const icon = item.icon ? <span className="h-4 w-4 shrink-0 text-slate-500">{item.icon}</span> : null;

  if (!item.href) {
    return (
      <span className={`${baseClasses} cursor-not-allowed text-slate-800`} title="Not built yet">
        {icon}
        {item.label}
        <NavBadge badge={item.badge} />
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={`${baseClasses} ${
        active
          ? "bg-indigo-50 text-indigo-600"
          : "text-slate-800 hover:bg-slate-100 hover:text-indigo-600"
      }`}
    >
      {icon}
      {item.label}
      <NavBadge badge={item.badge} />
    </Link>
  );
}

function SubLink({ item, active }: { item: NavItem; active: boolean }) {
  const baseClasses =
    "flex min-h-8 items-center gap-2 rounded-lg py-1.5 pl-8 pr-2.5 text-sm font-semibold transition-colors";

  if (!item.href) {
    return (
      <span className={`${baseClasses} cursor-not-allowed text-slate-800`} title="Not built yet">
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={`${baseClasses} ${
        active
          ? "text-indigo-600"
          : "text-slate-800 hover:text-indigo-600"
      }`}
    >
      {item.label}
    </Link>
  );
}

function SidebarSection({ section, pathname }: { section: NavSection; pathname: string }) {
  const [open, setOpen] = useState(true);

  if (!section.icon) {
    return (
      <section className="border-b border-slate-100 pb-4 last:border-b-0">
        <h2 className="mb-2 px-2.5 text-[11px] font-bold uppercase text-slate-500">{section.label}</h2>
        <div className="space-y-0.5">
          {section.items.map((item) => (
            <TopLevelLink key={item.label} item={item} active={isActivePath(pathname, item.href)} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-slate-100 pb-4">
      <h2 className="mb-2 px-2.5 text-[11px] font-bold uppercase text-slate-500">{section.label}</h2>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
      >
        <span className="h-4 w-4 shrink-0 text-slate-500">{section.icon}</span>
        <span className="flex-1 text-left">{section.triggerLabel ?? section.label}</span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="relative mt-0.5 space-y-0.5 before:absolute before:bottom-1 before:left-[19px] before:top-1 before:w-px before:bg-slate-200">
          {section.items.map((item) => (
            <SubLink key={item.label} item={item} active={isActivePath(pathname, item.href)} />
          ))}
        </div>
      )}
    </section>
  );
}

// Rendered on every shell-level route (no active App) — flat, 5 items, each
// with a sublabel — config/nav/shell.tsx.
function ShellNav({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  return (
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
      {shellNavItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
              active
                ? "bg-indigo-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                active ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {item.icon}
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{item.label}</span>
                  <span className={`block truncate text-xs ${active ? "text-indigo-100" : "text-zinc-400"}`}>
                    {item.sublabel}
                  </span>
                </span>
                {item.badge !== undefined && (
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                      active ? "bg-white/20 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.chevron && (
                  <ChevronRightIcon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-indigo-100" : "text-zinc-300"}`} />
                )}
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// Rendered on any App route (Media Workspace, Asset Intelligence, ThunderCare)
// — the existing per-persona sectioned nav, restyled to the light theme.
function AppNav({ appId, pathname, collapsed }: { appId: string; pathname: string; collapsed: boolean }) {
  const nav = resolveAppNavConfig(appId, pathname);

  if (collapsed) {
    return (
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        <Link
          href={nav.overviewItem.href!}
          title={nav.overviewItem.label}
          className="flex items-center justify-center rounded-lg bg-indigo-50 px-2.5 py-2 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
        >
          {nav.overviewItem.icon}
        </Link>
      </nav>
    );
  }

  return (
    <nav className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-4">
      <div>
        <div className="flex min-h-10 items-center gap-3 rounded-md bg-indigo-50 px-2.5 py-2 text-sm font-bold text-indigo-600">
          <span className="h-4 w-4">{nav.overviewItem.icon}</span>
          <Link href={nav.overviewItem.href!} className="flex-1">
            {nav.overviewItem.label}
          </Link>
        </div>
      </div>

      {nav.sections.map((section) => (
        <SidebarSection key={section.label} section={section} pathname={pathname} />
      ))}

      {nav.standaloneLinks.length > 0 && (
        <div className="space-y-0.5 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          {nav.standaloneLinks.map((item, index) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span className="pl-2.5 text-zinc-400">{nav.standaloneIcons[index]}</span>
              <TopLevelLink item={item} active={isActivePath(pathname, item.href)} />
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}

export function Sidebar({ tenantName }: { tenantName?: string | null }) {
  const pathname = usePathname();
  const activeApp = resolveActiveApp(pathname);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-zinc-200 bg-white transition-[width] duration-150 dark:border-zinc-800 dark:bg-zinc-950 ${
        collapsed ? "w-[76px]" : "w-[240px]"
      }`}
    >
      <Link
        href="/"
        className={`flex items-center gap-2.5 px-8 pb-7 pt-8 hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
          collapsed ? "justify-center px-2" : ""
        }`}
      >
        <span className="text-5xl font-black italic leading-none tracking-normal text-slate-950">
          T1
        </span>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-xl font-bold text-slate-950">
              Thunder<span className="text-indigo-600 dark:text-indigo-400">One</span>
            </p>
            <p className="text-[11px] font-bold uppercase text-slate-500">
              {activeApp?.tagline ?? SHELL_TAGLINE}
            </p>
          </div>
        )}
      </Link>

      {activeApp ? (
        <AppNav appId={activeApp.id} pathname={pathname} collapsed={collapsed} />
      ) : (
        <ShellNav pathname={pathname} collapsed={collapsed} />
      )}

      <div className="mt-auto px-5 pb-8 pt-3">
        {!collapsed && (
          <p className="sr-only">{tenantName ?? "Thunder One"}</p>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-indigo-600 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? <ArrowRightIcon className="h-4 w-4" /> : <ArrowLeftIcon className="h-4 w-4" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
