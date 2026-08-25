import { SearchInput } from "@/components/ui/SearchInput";
import { BellIcon, CalendarIcon, ChevronDownIcon, HelpIcon } from "@/components/ui/icons";
import { UserMenu } from "./UserMenu";

interface TopbarProps {
  userName: string;
  todayLabel: string;
  roleLabel?: string | null;
  notificationCount?: number;
}

export function Topbar({ userName, todayLabel, roleLabel, notificationCount = 13 }: TopbarProps) {
  return (
    <header className="flex items-center gap-4 border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <SearchInput className="max-w-sm" placeholder="Search anything in ThunderOne..." />
      <div className="ml-auto flex items-center gap-4">
        <span className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 sm:flex">
          <CalendarIcon className="h-3.5 w-3.5 text-zinc-400" />
          {todayLabel}
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
