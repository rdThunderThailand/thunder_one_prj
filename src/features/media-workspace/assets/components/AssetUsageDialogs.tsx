"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { permanentlyDeleteMediaAsset } from "@/lib/api/media-api";
import type { AssetDeleteBlockers } from "@/types/domain";
import { isDeleteBlocked, isInUse, trashUsageLoadingCopy } from "../asset-usage";
import { useAssetUsage } from "../useAssetUsage";
import { BlockedEntries, UsageEntries } from "./UsageLists";

export type AssetRef = { id: string; label: string };

const itemsText = (items: AssetRef[]) => (items.length === 1 ? items[0].label : `${items.length} items`);

/**
 * What still uses the Assets about to go to Trash (ADR 0091 Decision 3). Advisory only: it never
 * blocks the confirm. Mount it inside the dialog so every open reads current data. The note sizes
 * to its text; a long usage list scrolls inside UsageEntries.
 */
export function TrashUsageNotice({ items }: { items: AssetRef[] }) {
  const { usage, loading, failed } = useAssetUsage(items.map((item) => item.id));
  const entries = items.flatMap((item) => {
    const itemUsage = usage?.[item.id];
    return itemUsage && isInUse(itemUsage) ? [{ id: item.id, label: item.label, usage: itemUsage }] : [];
  });
  return (
    <div role="status" aria-busy={loading}>
      {loading ? (
        <p className="text-xs text-muted-foreground">{trashUsageLoadingCopy(items.length)}</p>
      ) : failed ? (
        <p className="text-xs text-muted-foreground">Could not check where this is used. You can still move it to Trash.</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">Not used anywhere.</p>
      ) : (
        <div className="space-y-2">
          <p className="rounded-lg bg-warning-muted p-3 text-xs leading-5 text-warning">
            Screens keep playing a file in Trash until it is removed from the Playlists and Layouts below. Programs that use it cannot publish
            changes until it is removed or recovered.
          </p>
          <UsageEntries entries={entries} />
        </div>
      )}
    </div>
  );
}

/** Move to Trash for one or many Assets from the library; one confirm covers the whole batch. */
export function TrashAssetsDialog({
  items,
  open,
  onOpenChange,
  onConfirm,
}: {
  items: AssetRef[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Move to Trash?</AlertDialogTitle>
          <AlertDialogDescription>{itemsText(items)} will be moved to Trash and can be recovered later.</AlertDialogDescription>
        </AlertDialogHeader>
        <TrashUsageNotice items={items} />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Move to Trash</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type Outcome = { deleted: number; failed: number; blocked: Array<AssetRef & { blockers: AssetDeleteBlockers }> };

function DeleteBody({ items, onClose, onDone }: { items: AssetRef[]; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const run = async () => {
    setBusy(true);
    const results = await Promise.allSettled(items.map((item) => permanentlyDeleteMediaAsset(item.id)));
    const blocked = results.flatMap((result, index) =>
      result.status === "fulfilled" && isDeleteBlocked(result.value) && result.value.blockers
        ? [{ ...items[index], blockers: result.value.blockers }]
        : [],
    );
    const failed = results.filter((result) => result.status === "rejected").length;
    setBusy(false);
    onDone();
    if (blocked.length === 0 && failed === 0) {
      onClose();
      return;
    }
    setOutcome({ deleted: items.length - blocked.length - failed, failed, blocked });
  };

  if (outcome) {
    return (
      <>
        <AlertDialogHeader>
          <AlertDialogTitle>{outcome.deleted > 0 ? "Some files could not be deleted" : "Could not delete"}</AlertDialogTitle>
          <AlertDialogDescription>
            {outcome.deleted > 0 && `${outcome.deleted} deleted. `}
            {outcome.blocked.length > 0 && `${outcome.blocked.length} still in use.`}
            {outcome.failed > 0 && ` ${outcome.failed} failed — try again.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {outcome.blocked.length > 0 && <BlockedEntries entries={outcome.blocked} />}
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </>
    );
  }
  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Permanent delete?</AlertDialogTitle>
        <AlertDialogDescription>{itemsText(items)} will be permanently deleted and cannot be recovered. Any broadcast history stays in Playback Proof.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
        <Button variant="destructive" disabled={busy} onClick={() => void run()}>
          Permanent delete
        </Button>
      </AlertDialogFooter>
    </>
  );
}

/**
 * Permanent delete for one or many Assets. Core refuses anything still in use (ADR 0101 Decision 2);
 * those come back named in one list instead of a raw error.
 */
export function DeleteAssetsDialog({
  items,
  open,
  onOpenChange,
  onDone,
}: {
  items: AssetRef[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <DeleteBody items={items} onClose={() => onOpenChange(false)} onDone={onDone} />
      </AlertDialogContent>
    </AlertDialog>
  );
}
