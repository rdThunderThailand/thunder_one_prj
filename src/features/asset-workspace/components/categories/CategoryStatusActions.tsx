"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { CheckCircleIcon, InfoIcon, MoreIcon } from "@/components/ui/icons";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import type { AssetCategoryDetail, CategoryStatus } from "../../domain/asset-category";

export function CategoryStatusActions({ category, busy, sending, onChange }: {
  category: AssetCategoryDetail;
  busy: boolean;
  sending: boolean;
  onChange: (status: CategoryStatus) => Promise<void>;
}) {
  const [confirm, setConfirm] = useState(false);
  const [menu, setMenu] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const active = category.status === "Active";
  const action = active ? "Deactivate" : "Activate";

  async function deactivate() {
    await onChange("Inactive");
    setConfirm(false);
  }

  return (
    <>
      <DropdownMenu open={menu} onOpenChange={setMenu}>
        <DropdownMenuTrigger asChild>
          <Button ref={trigger} variant="outline" size="icon-sm" disabled={busy}
            aria-label="Category actions" className="shrink-0 max-sm:size-10">
            <MoreIcon aria-hidden="true" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={(event) => {
          if (confirm) event.preventDefault();
        }}>
          <DropdownMenuItem disabled={busy} className="min-h-9 cursor-pointer" onSelect={() => {
            if (active) setConfirm(true);
            else void onChange("Active");
          }}>
            {active ? <InfoIcon aria-hidden="true" /> : <CheckCircleIcon aria-hidden="true" />}
            {action}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={confirm} onOpenChange={(open) => { if (!sending) setConfirm(open); }}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-xl"
          aria-busy={sending}
          onOpenAutoFocus={(event) => { event.preventDefault(); cancel.current?.focus(); }}
          onCloseAutoFocus={(event) => { event.preventDefault(); trigger.current?.focus(); }}>
          <DialogHeader>
            <DialogTitle className="break-words pr-6 leading-snug">Deactivate {category.name}?</DialogTitle>
            <DialogDescription className="space-y-3 pt-2" asChild>
              <div>
                {category.ownAssetCount > 0 && (
                  <p>
                    {category.ownAssetCount.toLocaleString("en-GB")} {category.ownAssetCount === 1 ? "asset stays" : "assets stay"} assigned to this category.
                  </p>
                )}
                <p>This category can no longer be chosen for new assets.</p>
                {category.childCount > 0 && <p>Its child categories keep their current status.</p>}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button ref={cancel} variant="outline" disabled={sending} onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="destructive" disabled={busy} onClick={() => void deactivate()}>
              {sending ? "Deactivating…" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
