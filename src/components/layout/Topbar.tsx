import { BellIcon, ChevronDownIcon, HelpIcon, SearchIcon } from "@/components/ui/icons";
import { UserMenu } from "./UserMenu";

interface TopbarProps {
  userName: string;
  roleLabel?: string | null;
  notificationCount?: number;
}

// 2026-09-16 shell redesign — dropped the date pill (not in the new
// mockup); added a language indicator. No i18n library exists anywhere in
// this repo, so it's a static, non-interactive label (honest about what it
// is) rather than a fake working switcher. Search bar is a bespoke,
// Figma-matched treatment rather than the shared `SearchInput` (that
// component's default look is shared with several thunder-care pages this
// task shouldn't touch).
export function Topbar({ userName, roleLabel, notificationCount = 13 }: TopbarProps) {
  return (
    // 2026-09-19: h-[88px]/px-9/gap-5 -> h-[68px]/px-6/gap-4 — measured off
    // the design reference's own header (69px tall, px-6), and matches the
    // sidebar's logo row (also trimmed to h-[68px] today) so the two borders
    // still line up.
    <header className="flex h-[68px] items-center gap-4 border-b border-[#e6edf9] bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      {/* h-12/px-4 -> h-9/px-3, icon 24px -> 16px, matching the reference's
          own 36px-tall search bar. */}
      <div className="flex h-9 w-full max-w-[700px] items-center gap-2.5 rounded-lg bg-[#eff5ff] px-3 dark:bg-zinc-900">
        <SearchIcon className="h-4 w-4 shrink-0 text-[#6074a9] dark:text-zinc-500" />
        <input
          type="text"
          placeholder="ค้นหาทุกอย่างใน ThunderOne..."
          className="w-full bg-transparent text-xs text-[#071858] outline-none placeholder:text-[#6074a9] dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        <kbd className="shrink-0 text-xs text-[#6074a9] dark:text-zinc-500">⌘ K</kbd>
      </div>
      {/* 2026-09-19: text-sm/font-bold -> text-xs/font-semibold, matching
          the design reference's own topbar controls (12px/600) — was
          14px/700, noticeably heavier/larger than the reference. Bell/Help
          icons 28px -> 20px, gap-5 -> gap-4, to match the tighter density. */}
      <div className="ml-auto flex items-center gap-4">
        <span
          className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-[#536999] dark:text-zinc-400 sm:flex"
          title="ยังไม่รองรับการเปลี่ยนภาษา"
        >
          TH
          <ChevronDownIcon className="h-4 w-4 text-[#536999] dark:text-zinc-500" />
        </span>
        <button
          className="relative text-[#536999] hover:text-[#071858] dark:text-zinc-400 dark:hover:text-zinc-100"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -right-1.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fb2c36] px-1 text-[10px] font-medium text-white">
              {notificationCount}
            </span>
          )}
        </button>
        <button
          className="text-[#536999] hover:text-[#071858] dark:text-zinc-400 dark:hover:text-zinc-100"
          aria-label="Help"
        >
          <HelpIcon className="h-5 w-5" />
        </button>
        <div className="border-l border-[#e6edf9] pl-4 dark:border-zinc-800">
          <UserMenu userName={userName} roleLabel={roleLabel} />
        </div>
      </div>
    </header>
  );
}
