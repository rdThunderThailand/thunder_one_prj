import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";
import { shellNavItems } from "@/config/nav/shell";

export function ShellNav({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  return (
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
      {shellNavItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
              active
                ? "bg-indigo-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                active ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {item.icon}
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{item.label}</span>
                  <span className={`block truncate text-xs ${active ? "text-indigo-100" : "text-zinc-400"}`}>
                    {item.sublabel}
                  </span>
                </span>
                {item.badge !== undefined && (
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                      active ? "bg-white/20 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.chevron && (
                  <ChevronRightIcon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-indigo-100" : "text-zinc-300"}`} />
                )}
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
