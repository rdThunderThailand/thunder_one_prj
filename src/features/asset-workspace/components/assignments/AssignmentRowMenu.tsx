"use client";

import Link from "next/link";
import { useId } from "react";
import { Button } from "@/components/ui/lovable/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import { EyeIcon, MoreIcon, ReturnIcon, TransferIcon } from "@/components/ui/icons";
import { actionHref, profileHref } from "../../domain/assignment-assign";
import { assignmentActions } from "../../domain/assignment-current";
import type { CurrentAssignment } from "../../services/asset-assignments-contract";

export function AssignmentRowMenu({ row }: { row: CurrentAssignment }) {
  const description = useId();
  const reasons = assignmentActions(row);
  const path = profileHref(row.asset.id, true);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.asset.name || "Unnamed asset"}`} aria-describedby={description}>
          <MoreIcon aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <span id={description} className="sr-only">
        {reasons.transfer ? `Transfer unavailable: ${reasons.transfer} ` : ""}
        {reasons.return ? `Return unavailable: ${reasons.return}` : ""}
      </span>
      <DropdownMenuContent align="end" className="max-w-72">
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
