"use client";

import type { ReactNode } from "react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import { DownloadIcon, MoreIcon, PrintIcon, ReturnIcon, TransferIcon } from "@/components/ui/icons";
import { useAssetLabels } from "../../hooks/use-asset-labels";
import { useAssetExport } from "../../hooks/use-asset-export";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { AssetLabelsDialog } from "../asset-labels/AssetLabelsDialog";
import { AssetsExportDialog } from "../assets-list/AssetsExportDialog";

export const LATER = "Available in a later release";

/** The wrapper keeps the explanation reachable even when the actual control is disabled. */
export function DisabledHint({ children, reason = LATER }: { children: ReactNode; reason?: string }) {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);
  return (
    <span tabIndex={0} aria-describedby={id} onFocus={() => setDismissed(false)} onMouseEnter={() => setDismissed(false)} onKeyDown={(event) => { if (event.key === "Escape") setDismissed(true); }} className="group/hint relative inline-flex max-w-full rounded-control focus-visible:outline-2 focus-visible:outline-ring">
      {children}
      <span role="tooltip" id={id} className={`pointer-events-none absolute bottom-full left-0 z-popover mb-1 hidden w-max max-w-64 rounded-control border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-float ${dismissed ? "" : "group-hover/hint:block group-focus-within/hint:block"}`}>
        {reason}
      </span>
    </span>
  );
}

export function FutureAction({ label, primary = false, kind = "transfer" }: { label: string; primary?: boolean; kind?: "transfer" | "return" }) {
  const Icon = kind === "transfer" ? TransferIcon : ReturnIcon;
  return (
    <DisabledHint>
      <Button disabled variant={primary ? "primary" : "outline"} size="sm" className="w-full max-sm:h-10">
        <Icon aria-hidden="true" className="size-4" />
        {label}
      </Button>
    </DisabledHint>
  );
}

export function ProfileActions({ context, asset }: { context: string; asset: AssetDetail }) {
  const labels = useAssetLabels(context, asset.id);
  const exportFlow = useAssetExport(context, asset.id);
  const trigger = useRef<HTMLButtonElement>(null);
  const openingDialog = useRef(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FutureAction label="Transfer" />
      <FutureAction label="Return" kind="return" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={trigger} variant="outline" size="icon-sm" aria-label="More asset actions" className="max-sm:size-10">
            <MoreIcon aria-hidden="true" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={(event) => {
          if (openingDialog.current) event.preventDefault();
          openingDialog.current = false;
        }}>
          <DropdownMenuItem disabled={asset.lifecycleStatus === "Disposed"} onSelect={() => {
            openingDialog.current = true;
            labels.open([{ id: asset.id, name: asset.name, assetTag: asset.assetTag, status: asset.lifecycleStatus }], trigger.current);
          }}>
            <PrintIcon aria-hidden="true" />
            Print label
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => {
            openingDialog.current = true;
            exportFlow.openSelected([asset.id], trigger.current);
          }}>
            <DownloadIcon aria-hidden="true" />
            Export
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AssetLabelsDialog flow={labels} />
      <AssetsExportDialog flow={exportFlow} />
    </div>
  );
}
