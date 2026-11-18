"use client";

import Link from "next/link";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/lovable/dropdown-menu";
import { Button } from "@/components/ui/lovable/button";
import {
  AssignmentIcon, DisposeIcon, EditIcon, EyeIcon, LocationIcon, MoreIcon, RefreshIcon, RetireIcon, ReturnIcon, TransferIcon,
} from "@/components/ui/icons";
import type { AssetListRow } from "../../services/assets-list-types";
import { assetReturnBlock } from "../../domain/assignment-return";
import { selectionOutcome, statusMenu, type SelectionAction } from "./selection-actions";

const CUSTODY = [
  { action: "assign", label: "Assign", Icon: AssignmentIcon },
  { action: "transfer", label: "Transfer", Icon: TransferIcon },
  { action: "move-location", label: "Move Location", Icon: LocationIcon },
] as const satisfies readonly { action: SelectionAction; label: string; Icon: unknown }[];
const STATUS_ICONS = { "change-status": RefreshIcon, retire: RetireIcon, dispose: DisposeIcon } as const;

/** PO row actions behind one ⋮: View, Edit, then only the actions this asset's status allows (05 §4.11). */
export function AssetsRowMenu({ row }: { row: AssetListRow }) {
  const name = row.name || "Unnamed asset";
  const profile = `/asset-workspace/assets/${encodeURIComponent(row.id)}`;
  const custody: { action: string; label: string; Icon: typeof ReturnIcon; href: string }[] = CUSTODY.flatMap(({ action, label, Icon }) => {
    const outcome = selectionOutcome(row, action);
    return "href" in outcome ? [{ action, label, Icon, href: outcome.href }] : [];
  });
  // Return sits after Transfer, as in 05 §4.11 (Assigned: Transfer; Return; …).
  if (!assetReturnBlock({ lifecycleStatus: row.status, custody: row.custody })) {
    const move = custody.findIndex((item) => item.action === "move-location");
    custody.splice(move < 0 ? custody.length : move, 0,
      { action: "return", label: "Return", Icon: ReturnIcon, href: `${profile}/return` });
  }
  const status = statusMenu(row);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`} title="Actions">
          <MoreIcon aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem asChild>
          <Link href={profile}>
            <EyeIcon aria-hidden="true" />
            View
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`${profile}/edit`}>
            <EditIcon aria-hidden="true" />
            Edit
          </Link>
        </DropdownMenuItem>
        {custody.length > 0 && <DropdownMenuSeparator />}
        {custody.map(({ action, label, Icon, href }) => (
          <DropdownMenuItem key={action} asChild>
            <Link href={href}>
              <Icon aria-hidden="true" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
        {status.length > 0 && <DropdownMenuSeparator />}
        {status.map(({ action, label, reason, href }) => {
          const Icon = STATUS_ICONS[action];
          return reason ? (
            <DropdownMenuItem key={action} disabled>
              <Icon aria-hidden="true" />
              {label}
              <span className="ml-auto rounded-control bg-muted px-1.5 py-0.5 text-2xs text-muted-foreground">{reason}</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={action} asChild>
              <Link href={href}>
                <Icon aria-hidden="true" />
                {label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
