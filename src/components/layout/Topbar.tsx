import { SearchInput } from "@/components/ui/SearchInput";
import { BellIcon, ChevronDownIcon, GlobeIcon, HelpIcon } from "@/components/ui/icons";
import { UserMenu } from "./UserMenu";

interface TopbarProps {
  userName: string;
  roleLabel?: string | null;
  notificationCount?: number;
}

// 2026-09-16 shell redesign — dropped the date pill (not in the new
// mockup); added a language indicator. No i18n library exists anywhere in
// this repo, so it's a static, non-interactive label (honest about what it
// is) rather than a fake working switcher.
export function Topbar({ userName, roleLabel, notificationCount = 13 }: TopbarProps) {
  return (
    <header className="flex items-center gap-4 border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <SearchInput className="max-w-sm" placeholder="ค้นหาทุกอย่างใน ThunderOne..." />
      <div className="ml-auto flex items-center gap-4">
        <span
          className="hidden shrink-0 items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 sm:flex"
          title="ยังไม่รองรับการเปลี่ยนภาษา"
        >
          <GlobeIcon className="h-3.5 w-3.5 text-zinc-400" />
          TH
          <ChevronDownIcon className="h-3 w-3 text-zinc-400" />
        </span>
        <button
          className="relative text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          aria-label="Notifications"
        >
          <BellIcon />
          {notificationCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
              {notificationCount}
            </span>
          )}
        </button>
        <button
          className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          aria-label="Help"
        >
          <HelpIcon />
        </button>
        <UserMenu userName={userName} roleLabel={roleLabel} />
      </div>
    </header>
  );
}
