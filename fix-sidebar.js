const fs = require('fs');

function fixFile(file, replacements) {
  let content = fs.readFileSync(file, 'utf8');
  for (let i = 0; i < replacements.length; i++) {
    const [search, replace] = replacements[i];
    if (content.includes(search)) {
      content = content.replace(search, replace);
    } else {
      console.log(`Failed to find replacement ${i+1} in ${file}`);
    }
  }
  fs.writeFileSync(file, content);
}

fixFile('src/components/layout/Sidebar.tsx', [
  [
`<<<<<<< HEAD
  // 2026-09-19: matched to the Media Workspace design reference's own nav
  // item typography (12px/500) — was text-sm/font-semibold (14px/600),
  // noticeably heavier/larger than the reference.
  // 2026-09-19: dimensions matched to the design reference too, not just
  // type — was min-h-9/px-2.5 (36px row, 10px padding); reference measures
  // an exact 32px row with 12px horizontal padding.
  const baseClasses =
    "flex h-8 w-full items-center gap-3 rounded-[10px] px-3 py-2 text-xs font-medium transition-colors";
=======
  const baseClasses = "flex min-h-9 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors";
>>>>>>> origin/feat/people-workspace`,
`  // 2026-09-19: matched to the Media Workspace design reference's own nav
  // item typography (12px/500) — was text-sm/font-semibold (14px/600),
  // noticeably heavier/larger than the reference.
  // 2026-09-19: dimensions matched to the design reference too, not just
  // type — was min-h-9/px-2.5 (36px row, 10px padding); reference measures
  // an exact 32px row with 12px horizontal padding.
  const baseClasses =
    "flex h-8 w-full items-center gap-3 rounded-[10px] px-3 py-2 text-xs font-medium transition-colors";`
  ],
  [
`<<<<<<< HEAD
  // 2026-09-19: same typography fix as TopLevelLink above.
  const baseClasses =
    "flex h-8 items-center gap-2 rounded-[10px] py-1.5 pl-8 pr-3 text-xs font-medium transition-colors";
=======
  const baseClasses = "flex min-h-8 items-center gap-2 rounded-lg py-1.5 pl-8 pr-2.5 text-sm font-semibold transition-colors";
>>>>>>> origin/feat/people-workspace`,
`  // 2026-09-19: same typography fix as TopLevelLink above.
  const baseClasses =
    "flex h-8 items-center gap-2 rounded-[10px] py-1.5 pl-8 pr-3 text-xs font-medium transition-colors";`
  ],
  [
`<<<<<<< HEAD
    <section className="border-b border-slate-100 pb-4">
      <h2 className="mb-2 px-3 text-3xs font-bold uppercase text-slate-500">{section.label}</h2>
=======
    <section className="border-b border-slate-100 pb-4 last:border-b-0">
      <h2 className="mb-2 px-2.5 text-[11px] font-bold uppercase text-slate-500">{section.label}</h2>
>>>>>>> origin/feat/people-workspace`,
`    <section className="border-b border-slate-100 pb-4 last:border-b-0">
      <h2 className="mb-2 px-3 text-3xs font-bold uppercase text-slate-500">{section.label}</h2>`
  ],
  [
`<<<<<<< HEAD
    <nav className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-2 pt-3 pb-4">
      <div>
        {/* 2026-09-19: font-bold -> font-semibold + rounded-md -> rounded-xl
            + px-2.5 -> px-3, matching the design reference's pinned
            "Overview" row (14px/600, 12px radius, 12px padding). */}
        <div className="flex min-h-10 items-center gap-3 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600">
=======
    <nav className="no-scrollbar min-h-0 flex-1 space-y-0 overflow-y-auto px-5 pb-3 tracking-normal">
      <div>
        <div
          className={\`flex min-h-10 items-center gap-3 rounded-md px-2.5 py-2 text-sm font-bold transition-colors \${
            overviewActive
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-800 hover:bg-slate-100 hover:text-indigo-600"
          }\`}
        >
>>>>>>> origin/feat/people-workspace`,
`    <nav className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-2 pt-3 pb-4 tracking-normal">
      <div>
        {/* 2026-09-19: font-bold -> font-semibold + rounded-md -> rounded-xl
            + px-2.5 -> px-3, matching the design reference's pinned
            "Overview" row (14px/600, 12px radius, 12px padding). */}
        <div
          className={\`flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors \${
            overviewActive
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-800 hover:bg-slate-100 hover:text-indigo-600"
          }\`}
        >`
  ],
  [
`<<<<<<< HEAD
      // 2026-09-19: 300px/76px -> 224px/64px (w-56/w-16) — measured directly
      // off the design reference's own sidebar (exactly 224px wide); this
      // was the single biggest contributor to the whole shell reading as
      // "bloated" next to it, more than any font-size difference.
      className={\`flex h-full shrink-0 flex-col border-r border-[#e6edf9] bg-white transition-[width] duration-150 dark:border-zinc-800 dark:bg-zinc-950 \${
        collapsed ? "w-16" : "w-56"
=======
      className={\`flex h-full shrink-0 flex-col border-r \${
        isMediaWorkspace ? "border-sidebar-border bg-sidebar" : "border-[#e6edf9] bg-white dark:border-zinc-800 dark:bg-zinc-950"
      } transition-[width] duration-150 \${
        collapsed ? (isMediaWorkspace ? "w-17" : "w-[76px]") : isMediaWorkspace ? "w-56" : "w-[300px]"
>>>>>>> origin/feat/people-workspace
      }\`}`,
`      // 2026-09-19: 300px/76px -> 224px/64px (w-56/w-16) — measured directly
      // off the design reference's own sidebar (exactly 224px wide); this
      // was the single biggest contributor to the whole shell reading as
      // "bloated" next to it, more than any font-size difference.
      className={\`flex h-full shrink-0 flex-col border-r \${
        isMediaWorkspace ? "border-sidebar-border bg-sidebar" : "border-[#e6edf9] bg-white dark:border-zinc-800 dark:bg-zinc-950"
      } transition-[width] duration-150 \${
        collapsed ? "w-16" : "w-56"
      }\`}`
  ],
  [
`<<<<<<< HEAD
        // 2026-09-19: h-[88px] -> h-[68px], matching the reference's own
        // logo-row height (68px, measured); px-10 -> px-5 since the row is
        // no longer wide enough for 40px of padding on each side.
        className={\`flex h-[68px] items-center border-b border-[#e6edf9] hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 \${
          // Was previously \`px-10 ... \${collapsed ? "justify-center px-2" : ""}\`
          // — both px-10 and px-2 ended up in the class list at once when
          // collapsed, and px-10 (40px) won the cascade over px-2 (8px),
          // leaving zero content width in the 80px link for the icon to sit
          // in (it silently flex-shrank to 0). Made mutually exclusive.
          collapsed ? "justify-center px-2" : "px-5"
=======
        className={\`flex items-center hover:bg-accent dark:hover:bg-zinc-900 \${
          isMediaWorkspace
            ? \`h-17 gap-3 border-b border-sidebar-border px-4 \${collapsed ? "justify-center px-2" : ""}\`
            : // Was previously \`px-10 ... \${collapsed ? "justify-center px-2" : ""}\`
              // — both px-10 and px-2 ended up in the class list at once when
              // collapsed, and px-10 (40px) won the cascade over px-2 (8px),
              // leaving zero content width in the 80px link for the icon to sit
              // in (it silently flex-shrank to 0). Made mutually exclusive.
              \`h-[88px] border-b border-[#e6edf9] dark:border-zinc-800 \${collapsed ? "justify-center px-2" : "px-10"}\`
>>>>>>> origin/feat/people-workspace
        }\`}`,
`        // 2026-09-19: h-[88px] -> h-[68px], matching the reference's own
        // logo-row height (68px, measured); px-10 -> px-5 since the row is
        // no longer wide enough for 40px of padding on each side.
        className={\`flex items-center \${
          isMediaWorkspace
            ? \`h-[68px] gap-3 border-b border-sidebar-border hover:bg-accent px-4 \${collapsed ? "justify-center px-2" : ""}\`
            : \`h-[68px] border-b border-[#e6edf9] hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 \${collapsed ? "justify-center px-2" : "px-5"}\`
        }\`}`
  ],
  [
`<<<<<<< HEAD
      {/* 2026-09-19: px-5 pb-5 pt-3 + two h-14 (56px) rows -> p-2 + two h-9
          (36px) rows, matching the reference's own compact bottom area
          (57px total, p-2 padding) — was nearly twice as tall. */}
      <div className="mt-auto border-t border-[#e6edf9] p-2 dark:border-zinc-800">
        {/* 2026-09-16 shell redesign — tenant name shown for real now (was
            sr-only-only before); no tenant switcher exists, so this is a
            static label with a decorative chevron, not a working picker. */}
        <div
          className={\`mb-2 flex h-9 items-center gap-2.5 rounded-lg border border-[#e6edf9] px-3 text-xs font-semibold text-[#071858] dark:border-zinc-800 dark:text-zinc-200 \${
            collapsed ? "justify-center" : ""
          }\`}
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
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={\`flex h-9 w-full items-center justify-center gap-2.5 rounded-lg border border-[#e6edf9] text-xs font-semibold text-[#61719e] transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900\`}
        >
          {collapsed ? <ArrowRightIcon className="h-4 w-4" /> : <ArrowLeftIcon className="h-4 w-4" />}
          {!collapsed && "ย่อเมนู"}
=======
      <div className={\`mt-auto \${isMediaWorkspace ? "border-t border-sidebar-border p-2" : "px-5 pb-5 pt-3"}\`}>
        {isMediaWorkspace ? (
          !collapsed && <p className="sr-only">{tenantName ?? "Thunder One"}</p>
        ) : (
          // 2026-09-16 shell redesign — tenant name shown for real now (was
          // sr-only-only before); no tenant switcher exists, so this is a
          // static label with a decorative chevron, not a working picker.
          <div
            className={\`mb-3 flex h-14 items-center gap-3 rounded-lg border border-[#e6edf9] px-4 text-sm font-bold text-[#071858] dark:border-zinc-800 dark:text-zinc-200 \${
              collapsed ? "justify-center" : ""
            }\`}
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
              ? \`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-accent hover:text-primary \${
                  collapsed ? "justify-center" : ""
                }\`
              : "flex h-14 w-full items-center justify-center gap-3 rounded-lg border border-[#e6edf9] text-sm font-bold text-[#61719e] transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
          }
        >
          {isMediaWorkspace ? (
            <>
              <MediaWorkspaceCollapseIcon open={collapsed} />
              {!collapsed && "Collapse"}
            </>
          ) : (
            <>
              {collapsed ? <ArrowRightIcon className="h-5 w-5" /> : <ArrowLeftIcon className="h-5 w-5" />}
              {!collapsed && "ย่อเมนู"}
            </>
          )}
>>>>>>> origin/feat/people-workspace`,
`      {/* 2026-09-19: px-5 pb-5 pt-3 + two h-14 (56px) rows -> p-2 + two h-9
          (36px) rows, matching the reference's own compact bottom area
          (57px total, p-2 padding) — was nearly twice as tall. */}
      <div className={\`mt-auto \${isMediaWorkspace ? "border-t border-sidebar-border p-2" : "border-t border-[#e6edf9] p-2 dark:border-zinc-800"}\`}>
        {isMediaWorkspace ? (
          !collapsed && <p className="sr-only">{tenantName ?? "Thunder One"}</p>
        ) : (
          {/* 2026-09-16 shell redesign — tenant name shown for real now (was
              sr-only-only before); no tenant switcher exists, so this is a
              static label with a decorative chevron, not a working picker. */}
          <div
            className={\`mb-2 flex h-9 items-center gap-2.5 rounded-lg border border-[#e6edf9] px-3 text-xs font-semibold text-[#071858] dark:border-zinc-800 dark:text-zinc-200 \${
              collapsed ? "justify-center" : ""
            }\`}
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
              ? \`flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-accent hover:text-primary \${
                  collapsed ? "justify-center" : ""
                }\`
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
          )}`
  ]
]);

fixFile('src/components/layout/UserMenu.tsx', [
  [
`<<<<<<< HEAD
        {/* 2026-09-19: 44px -> 32px, matching the design reference's own
            avatar size exactly (measured 32x32). */}
        <Avatar name={userName} size={32} className="shadow-sm" />
        {/* 2026-09-19: matched to the design reference's user-block
            typography direction (bold name, small light role label) — was
            text-base (16px) and a bespoke 12.8px, both noticeably larger
            than the reference's own (very compact) 10px/8px. */}
        <span className="text-left leading-tight">
          <span className="block text-2xs font-bold text-[#071858] dark:text-zinc-100">
            {userName}
          </span>
          {roleLabel && (
            <span className="block text-3xs text-[#6071a1] dark:text-zinc-400">{roleLabel}</span>
=======
        <Avatar name={userName} size={compact ? 32 : 44} className="shadow-sm" />
        <span className="text-left leading-tight">
          <span className={compact ? "block max-w-36 truncate text-xs font-semibold text-foreground" : "block text-base font-bold text-[#071858] dark:text-zinc-100"}>
            {userName}
          </span>
          {roleLabel && (
            <span className={compact ? "block text-[10px] text-muted-foreground" : "block text-[12.8px] text-[#6071a1] dark:text-zinc-400"}>{roleLabel}</span>
>>>>>>> origin/feat/people-workspace`,
`        {/* 2026-09-19: 44px -> 32px, matching the design reference's own
            avatar size exactly (measured 32x32). */}
        <Avatar name={userName} size={32} className="shadow-sm" />
        {/* 2026-09-19: matched to the design reference's user-block
            typography direction (bold name, small light role label) — was
            text-base (16px) and a bespoke 12.8px, both noticeably larger
            than the reference's own (very compact) 10px/8px. */}
        <span className="text-left leading-tight">
          <span className={compact ? "block max-w-36 truncate text-xs font-semibold text-foreground" : "block text-2xs font-bold text-[#071858] dark:text-zinc-100"}>
            {userName}
          </span>
          {roleLabel && (
            <span className={compact ? "block text-[10px] text-muted-foreground" : "block text-3xs text-[#6071a1] dark:text-zinc-400"}>{roleLabel}</span>`
  ]
]);

fixFile('src/features/media-workspace/overview/components/StatCardsRow.tsx', [
  [
`<<<<<<< HEAD
import { Sparkline } from "@/components/ui/Sparkline";
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  MonitorIcon,
  PaperPlaneIcon,
  WarningTriangleIcon,
} from "@/components/ui/icons";
import { statCards, type StatCardData } from "../mock-data";

// 2026-09-19: matched to the design reference's own stat-tile icon chips —
// a single neutral bg-muted chip with a semantic-colored icon (not a
// per-stat pastel background). indigo/blue/amber/emerald map onto this
// app's closest semantic tokens (primary/info/warning/success); "red" is a
// new addition for Offline (see mock-data.ts's own 2026-09-19 comment —
// Offline+Warning previously both reused "amber" and the calendar glyph).
const textColor: Record<StatCardData["color"], string> = {
  indigo: "text-primary",
  blue: "text-info",
  amber: "text-warning",
  emerald: "text-success",
  red: "text-danger",
};

const badgeColor: Record<StatCardData["color"], string> = {
  indigo: "bg-muted text-primary",
  blue: "bg-muted text-info",
  amber: "bg-muted text-warning",
  emerald: "bg-muted text-success",
  red: "bg-muted text-danger",
};

const iconFor: Record<StatCardData["icon"], React.ReactNode> = {
  monitor: <MonitorIcon />,
  paperPlane: <PaperPlaneIcon />,
  calendar: <CalendarIcon />,
  checkCircle: <CheckCircleIcon />,
  warningTriangle: <WarningTriangleIcon />,
  alertCircle: <AlertCircleIcon />,
};

function StatCard({ stat }: { stat: StatCardData }) {
  return (
    <Card className="flex min-h-31 flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        {/* 2026-09-19: text-sm/text-zinc-500 -> text-[11px]/font-semibold/
            text-muted-foreground, matching the reference's own stat label
            (11px/600). */}
        <p className="text-[11px] font-semibold text-muted-foreground">{stat.label}</p>
        <span
          className={\`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg \${badgeColor[stat.color]}\`}
        >
          {iconFor[stat.icon]}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        {/* font-semibold -> font-bold, text-zinc-900 -> text-foreground,
            matching the reference's stat value (24px/700). */}
        <span className="text-2xl font-bold text-foreground">
          {stat.value}
        </span>
        {stat.total && (
          <span className="text-sm text-muted-foreground">/ {stat.total}</span>
        )}
      </div>
      {/* text-xs -> text-2xs (10px), matching the reference's sub-line. */}
      {stat.delta && <p className="text-2xs text-muted-foreground">{stat.delta}</p>}
      <Sparkline data={stat.trend} className={\`h-8 w-full \${textColor[stat.color]}\`} />
    </Card>
  );
}

export function StatCardsRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
=======
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { summarizeChannels, type ChannelListItem } from "@/features/media-workspace/channels";

const cards = [
  { key: "total", label: "Total Channels", href: "/media-workspace/channels", color: "indigo", Icon: Monitor },
  { key: "online", label: "Online", href: "/media-workspace/channels?q=online", color: "emerald", Icon: CheckCircle2 },
  { key: "warning", label: "Warning", href: "/media-workspace/channels?q=warning", color: "amber", Icon: AlertTriangle },
  { key: "offline", label: "Offline", href: "/media-workspace/channels?q=offline", color: "red", Icon: XCircle },
] as const;

// 2026-09-19: icon chips matched to the design reference's own pattern — a
// single neutral bg-muted chip with a semantic-colored icon (not a per-stat
// pastel background); \`.bar\` (the mini progress bar at the bottom of each
// card) keeps a solid semantic fill, that part already matched the
// reference as-is.
const colors = {
  indigo: { icon: "bg-primary-soft text-primary", bar: "bg-primary" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  amber: { icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
  red: { icon: "bg-red-50 text-red-600", bar: "bg-red-500" },
};

export function StatCardsRow({ channels, loadFailed }: { channels: ChannelListItem[] | null; loadFailed: boolean }) {
  const summary = channels ? summarizeChannels(channels) : null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ key, label, href, color, Icon }) => {
        // ADR 0074 §4: Channel status is the Player's health, so this rolls up Channels now,
        // not Devices — \`summary\` is flat ({ total, online, warning, offline }).
        const value = summary?.[key];
        const percent = summary?.total ? Math.round(((value ?? 0) / summary.total) * 1000) / 10 : 0;
        return (
          <Link key={key} href={href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="flex h-[140px] flex-col rounded-xl border-border p-4 shadow-panel transition group-hover:-translate-y-0.5 group-hover:border-foreground/20 group-hover:shadow-float">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
                <span className={\`grid h-8 w-8 place-items-center rounded-lg \${colors[color].icon}\`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              {loadFailed ? (
                <>
                  <span className="mt-2 text-2xl font-bold text-zinc-400">—</span>
                  <p className="mt-auto truncate text-[10px] text-red-500">Could not load channel health</p>
                </>
              ) : summary === null ? (
                <div className="mt-2 space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <>
                  <span className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</span>
                  <p className="mt-auto truncate text-[10px] text-muted-foreground">
                    {key === "total" ? \`\${summary.total} Channels\` : \`\${percent}% of Channels\`}
                  </p>
                  <span className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className={\`block h-full origin-left animate-grow-bar rounded-full \${colors[color].bar}\`}
                      style={{ width: \`\${key === "total" ? 100 : percent}%\` }}
                    />
                  </span>
                </>
              )}
            </Card>
          </Link>
        );
      })}
      {/* Delivery success rate has no aggregate endpoint yet (docs/adr/0075 §7) —
          an honest empty state, not the Lovable mockup's invented "98.6%". */}
      <Card className="flex h-[140px] flex-col overflow-hidden rounded-xl border-border p-3 shadow-panel transition-[box-shadow,border-color] duration-200 hover:border-foreground/20 hover:shadow-float">
        <EmptyState icon={Gauge} title="No delivery data" detail="Delivery success rate isn't tracked yet." compact />
      </Card>
>>>>>>> origin/feat/people-workspace`,
`import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { summarizeChannels, type ChannelListItem } from "@/features/media-workspace/channels";

const cards = [
  { key: "total", label: "Total Channels", href: "/media-workspace/channels", color: "indigo", Icon: Monitor },
  { key: "online", label: "Online", href: "/media-workspace/channels?q=online", color: "emerald", Icon: CheckCircle2 },
  { key: "warning", label: "Warning", href: "/media-workspace/channels?q=warning", color: "amber", Icon: AlertTriangle },
  { key: "offline", label: "Offline", href: "/media-workspace/channels?q=offline", color: "red", Icon: XCircle },
] as const;

// 2026-09-19: icon chips matched to the design reference's own pattern — a
// single neutral bg-muted chip with a semantic-colored icon (not a per-stat
// pastel background); \`.bar\` (the mini progress bar at the bottom of each
// card) keeps a solid semantic fill, that part already matched the
// reference as-is.
const colors = {
  indigo: { icon: "bg-primary-soft text-primary", bar: "bg-primary" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  amber: { icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
  red: { icon: "bg-red-50 text-red-600", bar: "bg-red-500" },
};

export function StatCardsRow({ channels, loadFailed }: { channels: ChannelListItem[] | null; loadFailed: boolean }) {
  const summary = channels ? summarizeChannels(channels) : null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ key, label, href, color, Icon }) => {
        // ADR 0074 §4: Channel status is the Player's health, so this rolls up Channels now,
        // not Devices — \`summary\` is flat ({ total, online, warning, offline }).
        const value = summary?.[key];
        const percent = summary?.total ? Math.round(((value ?? 0) / summary.total) * 1000) / 10 : 0;
        return (
          <Link key={key} href={href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="flex h-[140px] flex-col rounded-xl border-border p-4 shadow-panel transition group-hover:-translate-y-0.5 group-hover:border-foreground/20 group-hover:shadow-float">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
                <span className={\`grid h-8 w-8 place-items-center rounded-lg \${colors[color].icon}\`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              {loadFailed ? (
                <>
                  <span className="mt-2 text-2xl font-bold text-zinc-400">—</span>
                  <p className="mt-auto truncate text-[10px] text-red-500">Could not load channel health</p>
                </>
              ) : summary === null ? (
                <div className="mt-2 space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <>
                  <span className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</span>
                  <p className="mt-auto truncate text-[10px] text-muted-foreground">
                    {key === "total" ? \`\${summary.total} Channels\` : \`\${percent}% of Channels\`}
                  </p>
                  <span className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className={\`block h-full origin-left animate-grow-bar rounded-full \${colors[color].bar}\`}
                      style={{ width: \`\${key === "total" ? 100 : percent}%\` }}
                    />
                  </span>
                </>
              )}
            </Card>
          </Link>
        );
      })}
      {/* Delivery success rate has no aggregate endpoint yet (docs/adr/0075 §7) —
          an honest empty state, not the Lovable mockup's invented "98.6%". */}
      <Card className="flex h-[140px] flex-col overflow-hidden rounded-xl border-border p-3 shadow-panel transition-[box-shadow,border-color] duration-200 hover:border-foreground/20 hover:shadow-float">
        <EmptyState icon={Gauge} title="No delivery data" detail="Delivery success rate isn't tracked yet." compact />
      </Card>`
  ]
]);

fixFile('src/features/media-workspace/overview/mock-data.ts', [
  [
`<<<<<<< HEAD
export interface StatCardData {
  id: string;
  label: string;
  value: string;
  total?: string;
  delta: string;
  trend: number[];
  color: "indigo" | "blue" | "amber" | "emerald" | "red";
  icon: "monitor" | "paperPlane" | "calendar" | "checkCircle" | "warningTriangle" | "alertCircle";
  failedLabel?: string;
  failedProgress?: number;
}

export const statCards: StatCardData[] = [
  {
    id: "total-channels",
    label: "Total Channels",
    value: "206",
    delta: "",
    trend: [40, 42, 38, 45, 50, 48, 55, 60, 58, 62, 65, 63],
    color: "indigo",
    icon: "monitor",
  },
  {
    id: "online-channels",
    label: "Online",
    value: "186",
    delta: "90.3% of total",
    trend: [30, 35, 33, 40, 45, 42, 48, 50, 55, 52, 58, 60],
    color: "blue",
    icon: "paperPlane",
  },
  {
    id: "warning-channels",
    label: "Warning",
    value: "12",
    delta: "5.8% of total",
    trend: [20, 25, 22, 28, 30, 27, 32, 35, 33, 38, 36, 40],
    color: "amber",
    icon: "warningTriangle",
  },
  {
    id: "offline-channels",
    label: "Offline",
    value: "8",
    delta: "3.9% of total",
    trend: [96, 97, 95, 98, 97, 99, 98, 97, 99, 98, 99, 98.6],
    color: "red",
    icon: "alertCircle",
  },
];

=======
>>>>>>> origin/feat/people-workspace`,
``
  ]
]);

fixFile('src/features/mission-control/components/WorkspaceCardsRow.tsx', [
  [
`<<<<<<< HEAD
              <span
=======
              <Link
                href={app.basePath}
                target="_blank"
                rel="noopener noreferrer"
>>>>>>> origin/feat/people-workspace`,
`              <span`
  ]
]);

