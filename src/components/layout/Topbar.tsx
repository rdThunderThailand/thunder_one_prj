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
