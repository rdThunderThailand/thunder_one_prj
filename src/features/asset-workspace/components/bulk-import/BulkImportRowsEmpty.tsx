import type { ComponentType } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckCircleIcon, ClipboardIcon, SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const PassedIcon: ComponentType<{ className?: string }> = ({ className }) => (
  <CheckCircleIcon className={cn(className, "text-success")} />
);

const TAB_MESSAGES: Record<string, { icon: ComponentType<{ className?: string }>; title: string; detail: string }> = {
  error: { icon: PassedIcon, title: "No errors found", detail: "No row will be skipped because of an error." },
  warning: { icon: PassedIcon, title: "No warnings found", detail: "No row needs your approval." },
  valid: { icon: ClipboardIcon, title: "No ready rows", detail: "Every row has a warning or an error." },
};

export function BulkImportRowsEmpty({ tab, searching }: { tab: string; searching: boolean }) {
  const message = searching
    ? { icon: SearchIcon, title: "No matching rows", detail: "Try a different search." }
    : TAB_MESSAGES[tab] ?? { icon: ClipboardIcon, title: "No rows to show", detail: "There are no rows in this tab." };
  return (
    <div role="status" className="flex flex-1 rounded-control border border-border">
      <EmptyState {...message} className="w-full" />
    </div>
  );
}
