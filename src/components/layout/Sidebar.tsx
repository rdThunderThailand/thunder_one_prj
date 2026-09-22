"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { resolveActiveApp } from "@/config/apps";
import { resolveAssetIntelligenceNav } from "@/config/nav/asset-intelligence";
import { mediaWorkspaceNav } from "@/config/nav/media-workspace";
import { peopleNav } from "@/config/nav/people";
import { settingsNavItems } from "@/config/nav/settings";
import { shellNavItems } from "@/config/nav/shell";
import { resolveThunderCareNav } from "@/config/nav/thunder-care";
import type { NavConfig, NavItem, NavSection } from "@/config/nav/types";
import { ArrowLeftIcon, ArrowRightIcon, BuildingIcon, ChevronDownIcon, ChevronRightIcon } from "@/components/ui/icons";
import { MediaWorkspaceBrand, MediaWorkspaceCollapseIcon, MediaWorkspaceNav } from "./media-workspace-sidebar";

const SETTINGS_ROUTE_PREFIXES = ["/profile", "/account-security"];

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
  // 2026-09-19: matched to the Media Workspace design reference's own nav
  // item typography (12px/500) — was text-sm/font-semibold (14px/600),
  // noticeably heavier/larger than the reference.
  // 2026-09-19: dimensions matched to the design reference too, not just
  // type — was min-h-9/px-2.5 (36px row, 10px padding); reference measures
  // an exact 32px row with 12px horizontal padding.
  const baseClasses =
    "flex h-8 w-full items-center gap-3 rounded-[10px] px-3 py-2 text-xs font-medium transition-colors";
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
  // 2026-09-19: same typography fix as TopLevelLink above.
  const baseClasses =
    "flex h-8 items-center gap-2 rounded-[10px] py-1.5 pl-8 pr-3 text-xs font-medium transition-colors";

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

  // 2026-09-19: section-label size matched to the design reference (~9px,
  // uppercase, bold) via the text-3xs token (globals.css); trigger button
  // matched to TopLevelLink's own 2026-09-19 fix (text-xs/font-medium).
  if (!section.icon) {
    return (
      <section className="border-b border-slate-100 pb-4 last:border-b-0">
        <h2 className="mb-2 px-3 text-3xs font-bold uppercase text-slate-500">{section.label}</h2>
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
      <h2 className="mb-2 px-3 text-3xs font-bold uppercase text-slate-500">{section.label}</h2>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-full items-center gap-3 rounded-[10px] px-3 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-100"
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

// Rendered on every shell-level route (no active App) — config/nav/shell.tsx.
// Restyled 2026-09-17 to match the compact list every App's own nav already
// uses (AppNav/TopLevelLink below): dense single-line rows and a subtle
// indigo-50 active state, replacing the earlier bespoke navy/solid-blue
// "card" treatment (which no longer matched once Media Workspace's sidebar
// became the reference). "หน้าแรก" is pinned/always-highlighted the same way
// Media Workspace's own "Overview" row is (compare config/nav/media-
// workspace.tsx's overviewItem + AppNav below) — it's the app's home anchor,
// not just another active-conditional link. Sublabels no longer have a
// second line to live in at this density; kept as a title tooltip instead of
// dropped outright. The logo/header above this nav is unrelated and unchanged.
function ShellNav({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  const [home, ...rest] = shellNavItems;

  return (
    <nav className={`min-h-0 flex-1 space-y-1 overflow-y-auto pb-3 pt-3 ${collapsed ? "px-3" : "px-2"}`}>
      <Link
        href={home.href}
        title={collapsed ? home.label : home.sublabel}
        className={`flex items-center gap-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300 ${
          collapsed ? "h-8 justify-center px-3 py-2" : "min-h-10 px-3 py-2 text-sm font-semibold"
        }`}
      >
        <span className="h-4 w-4 shrink-0">{home.icon}</span>
        {!collapsed && <span className="flex-1 truncate">{home.label}</span>}
      </Link>

      {rest.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : item.sublabel}
            className={`flex h-8 items-center gap-3 rounded-[10px] px-3 py-2 text-xs font-medium transition-colors ${
              active
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"
                : "text-slate-800 hover:bg-slate-100 hover:text-indigo-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <span className="h-4 w-4 shrink-0 text-slate-500">{item.icon}</span>
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-auto shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    {item.badge}
                  </span>
                )}
                {item.chevron && <ChevronRightIcon className="ml-1.5 h-3.5 w-3.5 shrink-0 text-slate-400" />}
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
          className="flex items-center justify-center rounded-[10px] bg-indigo-50 px-3 py-2 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
        >
          {nav.overviewItem.icon}
        </Link>
      </nav>
    );
  }

  return (
    <nav className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-2 pt-3 pb-4 tracking-normal">
      <div>
        {/* 2026-09-19: font-bold -> font-semibold + rounded-md -> rounded-xl
            + px-2.5 -> px-3, matching the design reference's pinned
            "Overview" row (14px/600, 12px radius, 12px padding). */}
        <div
          className={`flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
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

// A distinct, narrower nav shown only on /profile and /account-security —
// matches the Figma account-settings mockup, which has its own sidebar
// (back-link + 3 flat items) rather than the regular shell/app nav. No
// collapse toggle or tenant switcher here — the mockup doesn't have them,
// and a 3-item settings menu doesn't need to collapse.
function SettingsSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-[#e6edf9] bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <Link
        href="/"
        className="flex h-[88px] items-center border-b border-[#e6edf9] px-10 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- real brand SVG, not a photo; no next/image optimization needed */}
        <img src="/brand/t1-logo-horizontal.svg" alt="ThunderOne" className="h-9 w-auto dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/t1-logo-horizontal-dark.svg" alt="ThunderOne" className="hidden h-9 w-auto dark:block" />
      </Link>
      <div className="px-5 py-4">
        <Link
          href="/mission-control"
          className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          กลับไป ThunderOne
        </Link>
      </div>
      {/* Same nav-item tokens as ShellNav below (size/weight/color, active
          blue + shadow, 28px bare icons) — same design system as the main
          shell, just without a sublabel/badge/chevron line (Nie,
          2026-09-16: this sidebar's type/spacing didn't match the shell's). */}
      <nav className="flex flex-col gap-3 px-5 pt-2">
        {settingsNavItems.map((item) => {
          const active = item.id !== "settings" && (pathname === item.href || pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-5 rounded-lg px-5 py-3.5 transition-colors ${
                active
                  ? "bg-[#0860ef] text-white shadow-[0px_10px_7.5px_#bedbff,0px_4px_3px_#bedbff]"
                  : "text-[#071858] hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
              }`}
            >
              <span className={`shrink-0 [&>svg]:h-7 [&>svg]:w-7 ${active ? "text-white" : "text-[#071858] dark:text-zinc-200"}`}>
                {item.icon}
              </span>
              <span className="text-base font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function Sidebar({ tenantName }: { tenantName?: string | null }) {
  const pathname = usePathname();
  const activeApp = resolveActiveApp(pathname);
  const isMediaWorkspace = activeApp?.id === "media-workspace";
  const [collapsed, setCollapsed] = useState(false);

  if (SETTINGS_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return <SettingsSidebar pathname={pathname} />;
  }

  return (
    <aside
      // 2026-09-19: 300px/76px -> 224px/64px (w-56/w-16) — measured directly
      // off the design reference's own sidebar (exactly 224px wide); this
      // was the single biggest contributor to the whole shell reading as
      // "bloated" next to it, more than any font-size difference.
      className={`flex h-full shrink-0 flex-col border-r ${
        isMediaWorkspace ? "border-sidebar-border bg-sidebar" : "border-[#e6edf9] bg-white dark:border-zinc-800 dark:bg-zinc-950"
      } transition-[width] duration-150 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <Link
        href="/"
        // 2026-09-19: h-[88px] -> h-[68px], matching the reference's own
        // logo-row height (68px, measured); px-10 -> px-5 since the row is
        // no longer wide enough for 40px of padding on each side.
        className={`flex items-center ${
          isMediaWorkspace
            ? `h-[68px] gap-3 border-b border-sidebar-border hover:bg-accent px-4 ${collapsed ? "justify-center px-2" : ""}`
            : `h-[68px] border-b border-[#e6edf9] hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${collapsed ? "justify-center px-2" : "px-5"}`
        }`}
      >
        {isMediaWorkspace ? (
          <MediaWorkspaceBrand collapsed={collapsed} />
        ) : collapsed ? (
          // eslint-disable-next-line @next/next/no-img-element -- real brand SVG, not a photo
          <img src="/icon.svg" alt="ThunderOne" className="rounded-[9px]" style={{ width: 32, height: 32 }} />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/t1-logo-horizontal.svg" alt="ThunderOne" className="h-8 w-auto dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/t1-logo-horizontal-dark.svg" alt="ThunderOne" className="hidden h-8 w-auto dark:block" />
          </>
        )}
      </Link>

      {activeApp ? (
        <AppNav appId={activeApp.id} pathname={pathname} collapsed={collapsed} />
      ) : (
        <ShellNav pathname={pathname} collapsed={collapsed} />
      )}

      {/* 2026-09-19: px-5 pb-5 pt-3 + two h-14 (56px) rows -> p-2 + two h-9
          (36px) rows, matching the reference's own compact bottom area
          (57px total, p-2 padding) — was nearly twice as tall. */}
      <div className={`mt-auto ${isMediaWorkspace ? "border-t border-sidebar-border p-2" : "border-t border-[#e6edf9] p-2 dark:border-zinc-800"}`}>
        {isMediaWorkspace ? (
          !collapsed && <p className="sr-only">{tenantName ?? "Thunder One"}</p>
        ) : (
          {/* 2026-09-16 shell redesign — tenant name shown for real now (was
              sr-only-only before); no tenant switcher exists, so this is a
              static label with a decorative chevron, not a working picker. */}
          <div
            className={`mb-2 flex h-9 items-center gap-2.5 rounded-lg border border-[#e6edf9] px-3 text-xs font-semibold text-[#071858] dark:border-zinc-800 dark:text-zinc-200 ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? (tenantName ?? "Thunder One") : undefined}
          >
            <BuildingIcon className="h-4 w-4 shrink-0 text-slate-400" />
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{tenantName ?? "Thunder One"}</span>
                <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              </>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={
            isMediaWorkspace
              ? `flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-accent hover:text-primary ${
                  collapsed ? "justify-center" : ""
                }`
              : "flex h-9 w-full items-center justify-center gap-2.5 rounded-lg border border-[#e6edf9] text-xs font-semibold text-[#61719e] transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
          }
        >
          {isMediaWorkspace ? (
            <>
              <MediaWorkspaceCollapseIcon open={collapsed} />
              {!collapsed && "Collapse"}
            </>
          ) : (
            <>
              {collapsed ? <ArrowRightIcon className="h-4 w-4" /> : <ArrowLeftIcon className="h-4 w-4" />}
              {!collapsed && "ย่อเมนู"}
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
