"use client";

import Link from "next/link";
import { useState } from "react";
import { EditIcon, PlusIcon } from "@/components/ui/icons";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { Button } from "@/components/ui/lovable/button";
import { DISPOSED_WARRANTY_TEXT, warrantyWriteText } from "../../domain/warranty-form";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { setCurrentWarranty } from "../../services/warranty-write";

const flow = (assetId: string, rest: string) => `/asset-workspace/assets/${encodeURIComponent(assetId)}/warranty/${rest}?from=profile`;

/** FE 05 card header: Edit the current warranty and Add Warranty (Q19); disposed assets are view only (Q26). */
export function WarrantyCardActions({ asset }: { asset: AssetDetail }) {
  if (asset.lifecycleStatus === "Disposed") return <span className="text-2xs text-muted-foreground">{DISPOSED_WARRANTY_TEXT}</span>;
  const current = asset.currentWarranty;
  return (
    <div className="flex flex-wrap gap-2">
      {current && (
        <Button asChild variant="outline" size="sm">
          <Link href={flow(asset.id, `${encodeURIComponent(current.id)}/edit`)}>
            <EditIcon aria-hidden="true" className="size-4" />
            Edit
          </Link>
        </Button>
      )}
      <Button asChild variant="outline" size="sm">
        <Link href={flow(asset.id, "new")}>
          <PlusIcon aria-hidden="true" className="size-4" />
          Add Warranty
        </Link>
      </Button>
    </div>
  );
}

const setCurrentText = (code?: string, uncertain = false) =>
  code === "STALE" && !uncertain ? "The current warranty changed. Reload to see it." : warrantyWriteText(code, uncertain);

/** FE 05 Set as Current on an earlier record, behind the house confirm (Q16, G6-01). */
export function SetCurrentWarranty({ context, asset, warrantyId, onChanged }: {
  context: string; asset: AssetDetail; warrantyId: string;
  /** Reads the profile again in place. */
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<{ code: string; uncertain: boolean } | null>(null);
  if (asset.lifecycleStatus === "Disposed") return null;

  async function confirm() {
    setPending(true);
    setFailure(null);
    const result = await setCurrentWarranty(context, asset.id, warrantyId, asset.currentWarranty?.id ?? null, new AbortController().signal);
    if (result.ok) { onChanged(); return; }
    setPending(false);
    setFailure({ code: result.code, uncertain: result.uncertain });
  }

  const reload = failure && (failure.uncertain || ["STALE", "NOT_FOUND", "INVALID_STATE"].includes(failure.code));
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
      {failure && !open && (
        <>
          <p role="alert" className="text-xs text-error">{setCurrentText(failure.code, failure.uncertain)}</p>
          {reload && <Button type="button" variant="outline" size="sm" onClick={onChanged}>Reload</Button>}
        </>
      )}
      <AlertDialog open={open} onOpenChange={(next) => { if (!pending) setOpen(next); }}>
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setOpen(true)}>Set as Current</Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set as current warranty?</AlertDialogTitle>
            <AlertDialogDescription>Make this the current warranty? The current one stays in history.</AlertDialogDescription>
          </AlertDialogHeader>
          {failure && <p role="alert" className="text-sm text-error">{setCurrentText(failure.code, failure.uncertain)}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button type="button" disabled={pending || Boolean(reload)} onClick={confirm}>
              {pending ? "Saving…" : "Set as Current"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
