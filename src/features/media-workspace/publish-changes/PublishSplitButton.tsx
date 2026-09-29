"use client";

import { Button } from "@/components/ui/lovable/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/lovable/dropdown-menu";
import { ChevronDownIcon } from "@/components/ui/icons";

/** `Publish ▾` with the two publish paths (ADR 0078 §1). Either part of the button opens the menu. */
export function PublishSplitButton({
  disabled,
  hasAffectedPrograms,
  publishToChannelDisabledReason,
  onPublishChanges,
  onPublishToChannel,
}: {
  disabled: boolean;
  hasAffectedPrograms: boolean;
  /** Why "Publish to Channel…" is unavailable (needs a saved, clean row); `null` means available. */
  publishToChannelDisabledReason: string | null;
  onPublishChanges: () => void;
  onPublishToChannel: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={disabled}>
          Publish
          <ChevronDownIcon className="ml-1 h-4 w-4" />
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
        <DropdownMenuItem
          disabled={!!publishToChannelDisabledReason}
          title={publishToChannelDisabledReason ?? undefined}
          onSelect={onPublishToChannel}
        >
          Publish to Channel…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
