"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/lovable/dropdown-menu";
import {
  DisposeIcon, DownloadIcon, MoreIcon, PlusIcon, PrintIcon, RefreshIcon, RetireIcon, ReturnIcon, TransferIcon,
} from "@/components/ui/icons";
import { lifecycleMenu } from "../../domain/asset-lifecycle-actions";
import { actionHref, inAssignments, profileHref } from "../../domain/assignment-assign";
import { profileAssignmentActions } from "../../domain/assignment-profile";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { startAssetExport } from "../lifecycle/export-handoff";

export const LATER = "Available in a later release";

const LIFECYCLE_ICONS = { "change-status": RefreshIcon, retire: RetireIcon, dispose: DisposeIcon } as const;
const groupLabel = "px-2 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wide text-muted-foreground";

/** The wrapper keeps the explanation reachable even when the actual control is disabled.
 *  `below` opens it under the control, for toolbars at the top edge of a card that clips overflow. */
export function DisabledHint({ children, reason = LATER, below = false }: { children: ReactNode; reason?: string; below?: boolean }) {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);
  return (
    <span tabIndex={0} aria-describedby={id} onFocus={() => setDismissed(false)} onMouseEnter={() => setDismissed(false)} onKeyDown={(event) => { if (event.key === "Escape") setDismissed(true); }} className="group/hint relative inline-flex max-w-full rounded-control focus-visible:outline-2 focus-visible:outline-ring">
      {children}
      <span role="tooltip" id={id} className={`pointer-events-none absolute left-0 z-popover ${below ? "top-full mt-1" : "bottom-full mb-1"} hidden w-max max-w-64 rounded-control border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-float ${dismissed ? "" : "group-hover/hint:block group-focus-within/hint:block"}`}>
        {reason}
      </span>
    </span>
  );
}

export function ProfileCustodyActions({ asset, placement }: {
  asset: AssetDetail; placement: "header" | "rail" | "assignment";
}) {
  const eligibility = profileAssignmentActions(asset);
  const fromAssignments = inAssignments(usePathname());
  const actions = eligibility.assign ? ["assign"] as const : ["transfer", "return"] as const;
  return (
    <div className={placement === "rail" ? "grid gap-2 [&>span]:w-full" : "flex flex-wrap items-start gap-2"}>
      {actions.map((action) => {
        const label = (action === "assign" ? "Assign" : action === "transfer" ? "Transfer" : "Return")
          + (placement === "rail" ? " Asset" : "");
        const Icon = action === "assign" ? PlusIcon : action === "transfer" ? TransferIcon : ReturnIcon;
        const reason = action === "assign" ? null : eligibility[action];
        const variant = action === "assign" || (action === "transfer" && placement !== "header") ? "primary" : "outline";
        const className = placement === "rail" ? "w-full max-sm:h-10" : "max-sm:h-10";
        const content = (
          <>
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </>
        );
        return reason ? (
          <DisabledHint key={action} reason={reason}>
            <Button disabled variant={variant} size="sm" className={className}>{content}</Button>
          </DisabledHint>
        ) : (
          <Button key={action} asChild variant={variant} size="sm" className={className}>
            <Link href={actionHref(asset.id, action, fromAssignments)}>{content}</Link>
          </Button>
        );
      })}
    </div>
  );
}

// `context` stays in the props: AssetProfileView passes it and is outside this batch's paths.
export function ProfileActions({ asset }: { context: string; asset: AssetDetail }) {
  const router = useRouter();
  const profile = profileHref(asset.id, inAssignments(usePathname()));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ProfileCustodyActions asset={asset} placement="header" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label="More asset actions" className="max-sm:size-10">
            <MoreIcon aria-hidden="true" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className={groupLabel}>Lifecycle</DropdownMenuLabel>
          {lifecycleMenu(asset).map(({ action, label, reason }) => {
            const Icon = LIFECYCLE_ICONS[action];
            return reason ? (
              <DropdownMenuItem key={action} disabled>
                <Icon aria-hidden="true" />
                {label}
                <span className="ml-auto rounded-control bg-muted px-1.5 py-0.5 text-2xs text-muted-foreground">{reason}</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem key={action} asChild>
                <Link href={`${profile}/${action}`}>
                  <Icon aria-hidden="true" />
                  {label}
                </Link>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className={groupLabel}>Utilities</DropdownMenuLabel>
          {asset.lifecycleStatus === "Disposed" ? (
            <DropdownMenuItem disabled>
              <PrintIcon aria-hidden="true" />
              Print label
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href={`${profile}/label`}>
                <PrintIcon aria-hidden="true" />
                Print label
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => startAssetExport(router.push, { from: profile, ids: [asset.id] })}>
            <DownloadIcon aria-hidden="true" />
            Export
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
