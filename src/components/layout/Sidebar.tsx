"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { resolveActiveApp } from "@/config/apps";
import { resolveAssetIntelligenceNav } from "@/config/nav/asset-intelligence";
import { mediaWorkspaceNav } from "@/config/nav/media-workspace";
import { peopleNav } from "@/config/nav/people";
import { resolveThunderCareNav } from "@/config/nav/thunder-care";
import type { NavConfig, NavItem, NavSection } from "@/config/nav/types";
import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon } from "@/components/ui/icons";
import { MediaWorkspaceBrand, MediaWorkspaceCollapseIcon, MediaWorkspaceNav } from "./media-workspace-sidebar";
import { ShellNav } from "./shell-sidebar-nav";

const SHELL_TAGLINE = "Thunder One Shell";

// Media Workspace has one nav for the whole app; Asset Intelligence and
// ThunderCare each have one nav per persona, resolved from the route (see
// config/nav/asset-intelligence.tsx, config/nav/thunder-care.tsx). A null
// appId means the route belongs to no App — Thunder One's shell nav
// (config/nav/shell.tsx) applies instead — docs/adr/0033.
function resolveAppNavConfig(appId: string, pathname: string): NavConfig {
  if (appId === "asset-intelligence") return resolveAssetIntelligenceNav(pathname);
  if (appId === "thunder-care") return resolveThunderCareNav(pathname);
  if (appId === "people") return peopleNav;
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
  const baseClasses = "flex min-h-9 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors";
  const icon = item.icon ? <span className="h-4 w-4 shrink-0 text-slate-500">{item.icon}</span> : null;

  if (!item.href) {
    return (
      <span className={`${baseClasses} cursor-not-allowed select-none bg-slate-50 text-slate-400 opacity-75 dark:bg-zinc-900`} title="Not built yet">
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
  const baseClasses = "flex min-h-8 items-center gap-2 rounded-lg py-1.5 pl-8 pr-2.5 text-sm font-semibold transition-colors";

  if (!item.href) {
    return (
      <span className={`${baseClasses} cursor-not-allowed select-none bg-slate-50 text-slate-400 opacity-75 dark:bg-zinc-900`} title="Not built yet">
        {item.label}
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
    <section className="border-b border-slate-100 pb-4 last:border-b-0">
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

// Rendered on any App route (Media Workspace, Asset Intelligence, ThunderCare)
// — the existing per-persona sectioned nav, restyled to the light theme.
function AppNav({ appId, pathname, collapsed }: { appId: string; pathname: string; collapsed: boolean }) {
  const nav = resolveAppNavConfig(appId, pathname);
  const isMediaWorkspace = appId === "media-workspace";

  if (isMediaWorkspace) {
    return <MediaWorkspaceNav nav={nav} pathname={pathname} collapsed={collapsed} />;
  }

  const overviewActive = isActivePath(pathname, nav.overviewItem.href);

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
    <nav className="no-scrollbar min-h-0 flex-1 space-y-0 overflow-y-auto px-5 pb-3 tracking-normal">
      <div>
        <div
          className={`flex min-h-10 items-center gap-3 rounded-md px-2.5 py-2 text-sm font-bold transition-colors ${
            overviewActive
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-800 hover:bg-slate-100 hover:text-indigo-600"
          }`}
        >
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
  const isMediaWorkspace = activeApp?.id === "media-workspace";
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={isMediaWorkspace ? { fontFamily: "var(--font-manrope)" } : undefined}
      className={`flex h-full shrink-0 flex-col border-r border-zinc-200 bg-white transition-[width] duration-150 dark:border-zinc-800 dark:bg-zinc-950 ${
        collapsed ? (isMediaWorkspace ? "w-17" : "w-[76px]") : isMediaWorkspace ? "w-56" : "w-[240px]"
      }`}
    >
      <Link
        href={isMediaWorkspace ? "/media-workspace" : "/"}
        className={`flex items-center hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
          isMediaWorkspace
            ? "h-17 gap-3 border-b border-[oklch(0.929_0.013_255.508)] px-4"
            : "gap-2.5 px-8 pb-7 pt-8"
        } ${collapsed ? "justify-center px-2" : ""}`}
      >
        {isMediaWorkspace ? (
          <MediaWorkspaceBrand collapsed={collapsed} />
        ) : (
          <>
        <span className="text-5xl font-black italic leading-none tracking-normal text-slate-950">
          T<span className="text-[#026ffd]">1</span>
        </span>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-xl font-bold text-slate-950">
              Thunder<span className="text-[#026ffd]">One</span>
            </p>
            <p className={`text-[11px] text-slate-500 ${isMediaWorkspace ? "font-medium" : "font-bold uppercase"}`}>
              {activeApp?.tagline ?? SHELL_TAGLINE}
            </p>
          </div>
        )}
          </>
        )}
      </Link>

      {activeApp ? (
        <AppNav appId={activeApp.id} pathname={pathname} collapsed={collapsed} />
      ) : (
        <ShellNav pathname={pathname} collapsed={collapsed} />
      )}

      <div className={`mt-auto ${isMediaWorkspace ? "border-t border-[oklch(0.929_0.013_255.508)] p-2" : "px-5 pb-8 pt-3"}`}>
        {!collapsed && (
          <p className="sr-only">{tenantName ?? "Thunder One"}</p>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-indigo-600 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {isMediaWorkspace ? (
            <MediaWorkspaceCollapseIcon open={collapsed} />
          ) : collapsed ? (
            <ArrowRightIcon className="h-4 w-4" />
          ) : (
            <ArrowLeftIcon className="h-4 w-4" />
          )}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
