"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, CircleHelp, Search } from "lucide-react";
import { BellIcon, ChevronDownIcon, HelpIcon, SearchIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { resolveActiveApp } from "@/config/apps";
import { isEditorRoute } from "@/config/nav/editor-routes";
import { mediaWorkspaceNav } from "@/config/nav/media-workspace";
import { getPageHeaderSnapshot, subscribePageHeader } from "./page-header-store";
import { UserMenu } from "./UserMenu";

interface TopbarProps {
  userName: string;
  roleLabel?: string | null;
  notificationCount?: number;
}

// Only the Overview route publishes into the title store today (its
// `PageHeader` passes `titleInTopbar`) — this fallback exists solely to cover
// the gap before that effect fires on first paint, so it applies only to that
// one route. Every other Media Workspace page still renders its own
// `PageHeader` title in `main`, unchanged; showing a nav-derived guess for
// them here would just duplicate it (docs/adr/0075 §4).
function fallbackTitle(pathname: string): string | null {
  if (pathname !== mediaWorkspaceNav.overviewItem.href) return null;
  return mediaWorkspaceNav.overviewItem.label;
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Bangkok" }).format(new Date());
}

// Media Workspace's header, restyled to match the Lovable reference
// (docs/adr/0075). Every other App keeps the Topbar below unchanged.
function MediaWorkspaceTopbar({ userName, roleLabel, pathname }: TopbarProps & { pathname: string }) {
  const meta = useSyncExternalStore(subscribePageHeader, getPageHeaderSnapshot, () => null);
  const [bellOpen, setBellOpen] = useState(false);
  const title = meta?.title ?? fallbackTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-6 backdrop-blur">
      <div className="grid h-17 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          {title && <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground">{title}</h1>}
          {meta?.subtitle && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{meta.subtitle}</p>}
        </div>

        <label className="relative mx-auto hidden w-full max-w-md md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาทุกอย่างใน ThunderOne..."
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-14 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">⌘ K</kbd>
        </label>

        <div className="flex items-center gap-2">
          <span className="hidden h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground sm:flex">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            {todayLabel()}
          </span>
          <div className="relative">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Notifications"
              aria-expanded={bellOpen}
              onClick={() => setBellOpen((open) => !open)}
            >
              <Bell className="h-4 w-4" />
            </button>
            {bellOpen && (
              <>
                <button type="button" aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-10 cursor-default" onClick={() => setBellOpen(false)} />
                <div className="absolute right-0 top-10 z-20 w-72 rounded-lg border border-border bg-popover p-2 shadow-float">
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Latest alerts</p>
                  <EmptyState icon={Bell} title="No alerts yet" detail="There is no dedicated alerts feed yet." compact />
                </div>
              </>
            )}
          </div>
          <button type="button" className="hidden h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground sm:grid" aria-label="Help">
            <CircleHelp className="h-4 w-4" />
          </button>
          <div className="hidden items-center border-l border-border pl-3 lg:flex">
            <UserMenu userName={userName} roleLabel={roleLabel} variant="compact" />
          </div>
        </div>
      </div>
    </header>
  );
}

// 2026-09-16 shell redesign — dropped the date pill (not in the new
// mockup); added a language indicator. No i18n library exists anywhere in
// this repo, so it's a static, non-interactive label (honest about what it
// is) rather than a fake working switcher. Search bar is a bespoke,
// Figma-matched treatment rather than the shared `SearchInput` (that
// component's default look is shared with several thunder-care pages this
// task shouldn't touch).
function DefaultTopbar({ userName, roleLabel, notificationCount = 13 }: TopbarProps) {
  return (
    <header className="flex h-[88px] items-center gap-5 border-b border-[#e6edf9] bg-white px-9 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-12 w-full max-w-[700px] items-center gap-3 rounded-lg bg-[#eff5ff] px-4 dark:bg-zinc-900">
        <SearchIcon className="h-6 w-6 shrink-0 text-[#6074a9] dark:text-zinc-500" />
        <input
          type="text"
          placeholder="ค้นหาทุกอย่างใน ThunderOne..."
          className="w-full bg-transparent text-sm text-[#071858] outline-none placeholder:text-[#6074a9] dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        <kbd className="shrink-0 text-sm text-[#6074a9] dark:text-zinc-500">⌘ K</kbd>
      </div>
      <div className="ml-auto flex items-center gap-5">
        <span
          className="hidden shrink-0 items-center gap-1 text-sm font-bold text-[#536999] dark:text-zinc-400 sm:flex"
          title="ยังไม่รองรับการเปลี่ยนภาษา"
        >
          TH
          <ChevronDownIcon className="h-4 w-4 text-[#536999] dark:text-zinc-500" />
        </span>
        <button
          className="relative text-[#536999] hover:text-[#071858] dark:text-zinc-400 dark:hover:text-zinc-100"
          aria-label="Notifications"
        >
          <BellIcon className="h-7 w-7" />
          {notificationCount > 0 && (
            <span className="absolute -right-1.5 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#fb2c36] px-1 text-[11px] font-medium text-white">
              {notificationCount}
            </span>
          )}
        </button>
        <button
          className="text-[#536999] hover:text-[#071858] dark:text-zinc-400 dark:hover:text-zinc-100"
          aria-label="Help"
        >
          <HelpIcon className="h-7 w-7" />
        </button>
        <div className="border-l border-[#e6edf9] pl-5 dark:border-zinc-800">
          <UserMenu userName={userName} roleLabel={roleLabel} />
        </div>
      </div>
    </header>
  );
}

export function Topbar(props: TopbarProps) {
  const pathname = usePathname();
  const isMediaWorkspace = resolveActiveApp(pathname)?.id === "media-workspace";
  // Editors run in the focus shell (ADR 0077): the page header carries the title and back link.
  if (isMediaWorkspace && isEditorRoute(pathname)) return null;
  return isMediaWorkspace ? <MediaWorkspaceTopbar {...props} pathname={pathname} /> : <DefaultTopbar {...props} />;
}
