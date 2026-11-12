"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import { EyeIcon, ReturnIcon, TransferIcon } from "@/components/ui/icons";
import { actionHref, profileHref } from "../../domain/assignment-assign";
import { assignmentActions } from "../../domain/assignment-current";
import type { CurrentAssignment } from "../../services/asset-assignments-contract";

/** Point inside the row's first cell where the menu opens. */
export interface RowMenuAnchor { x: number; y: number }

/**
 * Row actions without a visible column (owner 2026-11-12): the row opens this menu where it was clicked. The trigger
 * is a visually hidden real button, so Tab, Enter/Space and screen readers reach it as before.
 */
export function AssignmentRowMenu({ row, open, anchor, onOpenChange }: {
  row: CurrentAssignment; open: boolean; anchor: RowMenuAnchor | null;
  onOpenChange: (open: boolean, trigger: HTMLButtonElement) => void;
}) {
  const description = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  // Keep the last point while the menu fades out (another row may already own the anchor).
  const [point, setPoint] = useState(anchor);
  if (anchor && anchor !== point) setPoint(anchor);
  const reasons = assignmentActions(row);
  const path = profileHref(row.asset.id, true);
  return (
    <DropdownMenu open={open} modal={false} onOpenChange={(next) => trigger.current && onOpenChange(next, trigger.current)}>
      <DropdownMenuTrigger asChild>
        <button
          ref={trigger}
          type="button"
          data-row-trigger
          aria-label={`Actions for ${row.asset.name || "Unnamed asset"}`}
          aria-describedby={description}
          className="pointer-events-none absolute size-px overflow-hidden opacity-0"
          style={{ left: point?.x ?? "100%", top: point?.y ?? "50%" }}
        />
      </DropdownMenuTrigger>
      <span id={description} className="sr-only">
        {reasons.transfer ? `Transfer unavailable: ${reasons.transfer} ` : ""}
        {reasons.return ? `Return unavailable: ${reasons.return}` : ""}
      </span>
      <DropdownMenuContent align="start" sideOffset={4} collisionPadding={8} className="max-w-72">
        <DropdownMenuItem asChild>
          <Link href={path}>
            <EyeIcon aria-hidden="true" />
            View Asset
          </Link>
        </DropdownMenuItem>
        {reasons.transfer ? (
          <DropdownMenuItem disabled className="items-start whitespace-normal">
            <TransferIcon aria-hidden="true" />
            <span>
              <span className="block">Transfer</span>
              <span className="block text-xs font-normal">{reasons.transfer}</span>
            </span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href={actionHref(row.asset.id, "transfer", true)}>
              <TransferIcon aria-hidden="true" />
              Transfer
            </Link>
          </DropdownMenuItem>
        )}
        {reasons.return ? (
          <DropdownMenuItem disabled className="items-start whitespace-normal">
            <ReturnIcon aria-hidden="true" />
            <span>
              <span className="block">Return</span>
              <span className="block text-xs font-normal">{reasons.return}</span>
            </span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href={actionHref(row.asset.id, "return", true)}>
              <ReturnIcon aria-hidden="true" />
              Return
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
