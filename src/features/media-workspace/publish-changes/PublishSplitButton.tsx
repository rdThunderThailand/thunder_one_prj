"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/lovable/dropdown-menu";
import { ChevronDownIcon } from "@/components/ui/icons";
import { PublishPrepDialog, type PublishPrep } from "./PublishPrepDialog";

/** `Publish ▾` with the two publish paths (ADR 0078 §1). The button runs the path that fits (ADR 0116):
 *  Publish Changes once an active or scheduled Program uses this row, Publish to Channel… before that.
 *  The menu keeps both. When the row is not ready to air, Publish to Channel… opens `PublishPrepDialog`
 *  instead of being disabled with a tooltip nobody finds (UAT #401). */
export function PublishSplitButton({
  disabled,
  hasAffectedPrograms,
  publishToChannelPrep,
  onPublishChanges,
  onPublishToChannel,
}: {
  disabled: boolean;
  hasAffectedPrograms: boolean;
  /** What must happen first (save, activate); `null` means the wizard can open now. */
  publishToChannelPrep: PublishPrep | null;
  onPublishChanges: () => void;
  /** `id` is the row just saved by the prep step; omitted when no prep was needed. */
  onPublishToChannel: (id?: string) => void;
}) {
  // Held from the click, not read live: the save it runs makes the row ready, and a live read would
  // unmount the dialog before its continuation fires.
  const [openPrep, setOpenPrep] = useState<PublishPrep | null>(null);
  const publishToChannel = () => (publishToChannelPrep ? setOpenPrep(publishToChannelPrep) : onPublishToChannel());
  const primary = hasAffectedPrograms
    ? { label: "Publish Changes", onClick: onPublishChanges }
    : { label: "Publish to Channel", onClick: publishToChannel };

  return (
    <div className="flex">
      <Button
        size="sm"
        className="rounded-r-none"
        disabled={disabled}
        onClick={primary.onClick}
      >
        {primary.label}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            aria-label="ตัวเลือกการเผยแพร่"
            className="rounded-l-none border-l border-primary-foreground/25 px-2"
            disabled={disabled}
          >
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem disabled={!hasAffectedPrograms} onSelect={onPublishChanges}>
            <span className="flex flex-col">
              <span>Publish Changes</span>
              {!hasAffectedPrograms && (
                <span className="text-xs text-muted-foreground">Not used by any program</span>
              )}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={publishToChannel}>Publish to Channel…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {openPrep && (
        <PublishPrepDialog
          prep={openPrep}
          onReady={(id) => {
            setOpenPrep(null);
            onPublishToChannel(id);
          }}
          onClose={() => setOpenPrep(null)}
        />
      )}
    </div>
  );
}
