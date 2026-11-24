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
  { id: "create-publication", label: "Create Publication", icon: <MegaphoneIcon />, href: "/media-workspace/program/create" },
  { id: "upload-media", label: "Upload Media", icon: <UploadIcon />, href: "/media-workspace/assets/upload" },
  { id: "my-work", label: "My Work", icon: <CheckCircleIcon />, href: "/my-work" },
  { id: "reports", label: "View Reports", icon: <ChartIcon />, href: null },
  { id: "calendar", label: "Team Calendar", icon: <CalendarIcon />, href: null },
];

export const EMPLOYEE_QUICK_ACCESS: QuickAccessItem[] = [
  { id: "create-publication", label: "Create Publication", icon: <MegaphoneIcon />, href: "/media-workspace/program/create" },
  { id: "upload-media", label: "Upload Media", icon: <UploadIcon />, href: "/media-workspace/assets/upload" },
  { id: "my-work", label: "My Work", icon: <CheckCircleIcon />, href: "/my-work" },
  { id: "calendar", label: "Calendar", icon: <CalendarIcon />, href: null },
];

// Shortcuts to real pages; the ones with no page yet stay inert. The old
// mock "Approvals 3" badge is gone — My Work has the real counts.
export function QuickAccessCard({ items }: { items: QuickAccessItem[] }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Quick Access</h2>
      <ul className="flex flex-col divide-y divide-border">
        {items.map((item) => {
          const content = (
            <>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              <ChevronRightIcon className="h-3.5 w-3.5 text-t1-gray-400" />
            </>
          );
          return (
            <li key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-2.5 py-2.5 text-sm text-foreground hover:text-primary"
                >
                  {content}
                </Link>
              ) : (
                <div
                  title="Not built yet"
                  className="flex cursor-not-allowed items-center gap-2.5 py-2.5 text-sm text-t1-gray-400"
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
