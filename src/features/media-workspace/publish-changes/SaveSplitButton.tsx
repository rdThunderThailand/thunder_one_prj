"use client";

import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/lovable/dropdown-menu";
import { ChevronDownIcon } from "@/components/ui/icons";

/** The editors' `Save ▾`: the default save, plus one alternate save in the menu (Layout: Save & Activate,
 *  Playlist: Save Draft — ADR 0116). Same Radix menu as `PublishSplitButton`, so opening one closes the
 *  other instead of the two menus stacking (#404 verification). */
export function SaveSplitButton({
  label,
  saving,
  disabledReason,
  onSave,
  alternate,
}: {
  label: string;
  saving: boolean;
  /** Why the default save is unavailable; `null` means available. */
  disabledReason: string | null;
  onSave: () => void;
  /** Omitted → a plain Save button with no menu. */
  alternate?: { label: string; disabledReason: string | null; onSelect: () => void };
}) {
  return (
    <div className="flex">
      <Button
        size="sm"
        className={alternate ? "rounded-r-none" : undefined}
        onClick={onSave}
        disabled={saving || !!disabledReason}
        title={disabledReason ?? undefined}
      >
        {saving ? "กำลังบันทึก..." : label}
      </Button>
      {alternate && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              aria-label="ตัวเลือกการบันทึก"
              className="rounded-l-none border-l border-primary-foreground/25 px-2"
              disabled={saving}
            >
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              disabled={!!alternate.disabledReason}
              title={alternate.disabledReason ?? undefined}
              onSelect={alternate.onSelect}
            >
              {alternate.label}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
