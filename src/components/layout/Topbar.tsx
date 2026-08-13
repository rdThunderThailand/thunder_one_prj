import { SearchInput } from "@/components/ui/SearchInput";
import { BellIcon, HelpIcon } from "@/components/ui/icons";
import { UserMenu } from "./UserMenu";

interface TopbarProps {
  userName: string;
  notificationCount?: number;
}

export function Topbar({
  userName,
  notificationCount = 13,
}: TopbarProps) {
  return (
    <header className="flex items-center gap-4 border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <SearchInput className="max-w-sm" />
      <div className="ml-auto flex items-center gap-4">
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
        <UserMenu userName={userName} />
      </div>
    </header>
  );
}
