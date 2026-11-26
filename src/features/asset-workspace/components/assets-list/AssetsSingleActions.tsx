"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/lovable/dropdown-menu";
import {
  AssignmentIcon, ChevronDownIcon, DisposeIcon, LocationIcon, RefreshIcon, RetireIcon, TransferIcon,
} from "@/components/ui/icons";
import type { AssetListRow } from "../../services/assets-list-types";
import { DisabledHint } from "../asset-profile/ProfileControls";
import { selectionOutcome, singleOnlyHint, statusMenu, type SelectionAction } from "./selection-actions";

const BUTTONS = [
  { action: "assign", label: "Assign", Icon: AssignmentIcon },
  { action: "transfer", label: "Transfer", Icon: TransferIcon },
  { action: "move-location", label: "Move Location", Icon: LocationIcon },
] as const;
const STATUS_ICONS = { "change-status": RefreshIcon, retire: RetireIcon, dispose: DisposeIcon } as const;
const BUTTON_CLASS = "px-2 max-sm:h-10";

type Blocked = { title: string; body: string; alternative: { label: string; href: string } | null };

/** One selected asset: open its action page, or explain why it can't. Two or more: greyed out with a hint. */
export function AssetsSingleActions({ row, count }: { row: AssetListRow | null; count: number }) {
  const [blocked, setBlocked] = useState<Blocked | null>(null);

  if (!row || count !== 1) {
    return (
      <>
        {BUTTONS.map(({ action, label, Icon }) => (
          <DisabledHint key={action} below reason={singleOnlyHint(action)}>
            <Button disabled variant="outline" size="sm" className={BUTTON_CLASS}>
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </Button>
          </DisabledHint>
        ))}
        <DisabledHint below reason={singleOnlyHint("status")}>
          <Button disabled variant="outline" size="sm" className={BUTTON_CLASS}>
            Update Status
            <ChevronDownIcon aria-hidden="true" className="size-3" />
          </Button>
        </DisabledHint>
      </>
    );
  }

  function open(action: SelectionAction) {
    const outcome = selectionOutcome(row!, action);
    if (!("href" in outcome)) setBlocked(outcome);
  }

  return (
    <>
      {BUTTONS.map(({ action, label, Icon }) => {
        const outcome = selectionOutcome(row, action);
        const content = (
          <>
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </>
        );
        return "href" in outcome ? (
          <Button key={action} asChild variant="outline" size="sm" className={BUTTON_CLASS}>
            <Link href={outcome.href}>{content}</Link>
          </Button>
        ) : (
          <Button key={action} variant="outline" size="sm" className={BUTTON_CLASS} onClick={() => open(action)}>
            {content}
          </Button>
        );
      })}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={BUTTON_CLASS}>
            Update Status
            <ChevronDownIcon aria-hidden="true" className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {statusMenu(row).map(({ action, label, reason, href }) => {
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
      {blocked && (
        <Dialog open onOpenChange={(next) => { if (!next) setBlocked(null); }}>
          <DialogContent className="rounded-card bg-card p-0 sm:max-w-sm sm:rounded-card [&>button]:size-8">
            <DialogHeader className="p-4 pb-2 text-left">
              <DialogTitle className="pr-6">{blocked.title}</DialogTitle>
              <DialogDescription>{blocked.body}</DialogDescription>
            </DialogHeader>
            <p className="mx-4 rounded-control bg-muted/60 px-3 py-2 text-xs text-foreground">
              <span className="font-medium">{row.name}</span>
              <span className="text-muted-foreground"> · {row.asset_code} · {row.status}</span>
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border p-4">
              <Button variant="outline" size="sm" onClick={() => setBlocked(null)}>Close</Button>
              {blocked.alternative && (
                <Button asChild variant="primary" size="sm">
                  <Link href={blocked.alternative.href}>{blocked.alternative.label}</Link>
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
