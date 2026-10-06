"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { CalendarDays, CircleHelp } from "lucide-react";
import { HelpIcon } from "@/components/ui/icons";
import { resolveActiveApp } from "@/config/apps";
import { isEditorRoute } from "@/config/nav/editor-routes";
import { mediaWorkspaceNav } from "@/config/nav/media-workspace";
import { HelpTrigger } from "@/features/help/components/HelpTrigger";
import type { HelpSupportConfig } from "@/features/help/support";
import type { AppLocale } from "@/lib/app-locale";
import { LanguageSwitch } from "./LanguageSwitch";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "./NotificationBell";
import { getPageHeaderSnapshot, subscribePageHeader } from "./page-header-store";
import { UserMenu } from "./UserMenu";

interface TopbarProps {
  userName: string;
  roleLabel?: string | null;
  avatarUrl?: string | null;
  /** Help panel Support Channels, read from env on the server (config/env.ts). */
  helpSupport?: HelpSupportConfig;
  /** The shell language from the t1_lang cookie (lib/app-locale). */
  locale: AppLocale;
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
function MediaWorkspaceTopbar({ userName, roleLabel, avatarUrl, helpSupport, locale, pathname }: TopbarProps & { pathname: string }) {
  const meta = useSyncExternalStore(subscribePageHeader, getPageHeaderSnapshot, () => null);
  const title = meta?.title ?? fallbackTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-6 backdrop-blur">
      <div className="grid h-17 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          {title && <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground">{title}</h1>}
          {meta?.subtitle && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{meta.subtitle}</p>}
        </div>

        <GlobalSearch variant="media" />

        <div className="flex items-center gap-2">
          <span className="hidden h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground sm:flex">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            {todayLabel()}
          </span>
          {/* ADR 0075 §5 removed a non-functional TH pill from this header; this switch works (sets the app language). */}
          <LanguageSwitch initialLocale={locale} className="hidden text-muted-foreground hover:bg-accent hover:text-foreground sm:flex" />
          <NotificationBell variant="media" />
          {/* Visible on phones too: Help's mobile surface is the full-screen drawer (Help Spec AC-025). */}
          <HelpTrigger
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            support={helpSupport}
          >
            <CircleHelp className="h-4 w-4" />
          </HelpTrigger>
          <div className="hidden items-center border-l border-border pl-3 lg:flex">
            <UserMenu userName={userName} roleLabel={roleLabel} avatarUrl={avatarUrl} variant="compact" />
          </div>
        </div>
      </div>
    </header>
  );
}

// 2026-09-16 shell redesign — dropped the date pill (not in the new
// mockup); added a language indicator. 2026-10-06: the indicator is now a
// working switch (LanguageSwitch) that sets the app language. Search bar is a bespoke,
// Figma-matched treatment rather than the shared `SearchInput` (that
// component's default look is shared with several thunder-care pages this
// task shouldn't touch).
function DefaultTopbar({ userName, roleLabel, avatarUrl, helpSupport, locale }: TopbarProps) {
  return (
    // 2026-09-19: h-[88px]/px-9/gap-5 -> h-[68px]/px-6/gap-4 — measured off
    // the design reference's own header (69px tall, px-6), and matches the
    // sidebar's logo row (also trimmed to h-[68px] today) so the two borders
    // still line up.
    <header className="flex h-[68px] items-center gap-4 border-b border-[#e6edf9] bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      {/* h-12/px-4 -> h-9/px-3, icon 24px -> 16px, matching the reference's
          own 36px-tall search bar. */}
      <GlobalSearch variant="default" />
      {/* 2026-09-19: text-sm/font-bold -> text-xs/font-semibold, matching
          the design reference's own topbar controls (12px/600) — was
          14px/700, noticeably heavier/larger than the reference. Bell/Help
          icons 28px -> 20px, gap-5 -> gap-4, to match the tighter density.
          2026-09-29: every control sits in the same 36px box (like the Media
          Workspace Topbar) with one gap, so TH / bell / help / divider /
          profile are spaced evenly — the bare icons made the gaps uneven. */}
      <div className="ml-auto flex items-center gap-1">
        <LanguageSwitch
          initialLocale={locale}
          className="hidden text-[#536999] hover:bg-slate-50 hover:text-[#071858] dark:text-zinc-400 sm:flex"
        />
        <NotificationBell variant="default" />
        <HelpTrigger
          className="grid h-9 w-9 place-items-center rounded-lg text-[#536999] hover:bg-slate-50 hover:text-[#071858] dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          support={helpSupport}
        >
          <HelpIcon className="h-5 w-5" />
        </HelpTrigger>
        <span
          aria-hidden="true"
          className="mx-2 h-6 w-px bg-[#e6edf9] dark:bg-zinc-800"
        />
        <UserMenu
          userName={userName}
          roleLabel={roleLabel}
          avatarUrl={avatarUrl}
        />
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
