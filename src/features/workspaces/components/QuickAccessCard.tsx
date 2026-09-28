import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { CalendarIcon, ChartIcon, CheckCircleIcon, ChevronRightIcon, MegaphoneIcon, UploadIcon } from "@/components/ui/icons";

export interface QuickAccessItem {
  id: string;
  label: string;
  icon: ReactNode;
  href: string | null;
}

export const MANAGER_QUICK_ACCESS: QuickAccessItem[] = [
  { id: "create-publication", label: "Create Publication", icon: <MegaphoneIcon />, href: "/media-workspace/publications/create" },
  { id: "upload-media", label: "Upload Media", icon: <UploadIcon />, href: "/media-workspace/assets/upload" },
  { id: "my-work", label: "My Work", icon: <CheckCircleIcon />, href: "/my-work" },
  { id: "reports", label: "View Reports", icon: <ChartIcon />, href: null },
  { id: "calendar", label: "Team Calendar", icon: <CalendarIcon />, href: null },
];

export const EMPLOYEE_QUICK_ACCESS: QuickAccessItem[] = [
  { id: "create-publication", label: "Create Publication", icon: <MegaphoneIcon />, href: "/media-workspace/publications/create" },
  { id: "upload-media", label: "Upload Media", icon: <UploadIcon />, href: "/media-workspace/assets/upload" },
  { id: "my-work", label: "My Work", icon: <CheckCircleIcon />, href: "/my-work" },
  { id: "calendar", label: "Calendar", icon: <CalendarIcon />, href: null },
];

// Shortcuts to real pages; the ones with no page yet stay inert. The old
// mock "Approvals 3" badge is gone — My Work has the real counts.
export function QuickAccessCard({ items }: { items: QuickAccessItem[] }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Quick Access</h2>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {items.map((item) => {
          const content = (
            <>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              <ChevronRightIcon className="h-3.5 w-3.5 text-zinc-300" />
            </>
          );
          return (
            <li key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-2.5 py-2.5 text-sm text-zinc-700 hover:text-indigo-600 dark:text-zinc-200"
                >
                  {content}
                </Link>
              ) : (
                <div
                  title="Not built yet"
                  className="flex cursor-not-allowed items-center gap-2.5 py-2.5 text-sm text-zinc-400"
                >
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
