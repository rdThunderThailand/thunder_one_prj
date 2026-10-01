"use client";

import { Fragment } from "react";
import Link from "next/link";
import { MoreIcon } from "@/components/ui/icons";
import { Button, buttonVariants } from "@/components/ui/lovable/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/lovable/dropdown-menu";
import { cn } from "@/lib/utils";
import { rowActionsFor, type RowAction } from "../publication-list-display";
import type { PublicationListItem } from "../types";

const LABELS: Record<RowAction, string> = {
  edit: "Edit",
  open: "Open",
  view: "View",
  publish: "Publish",
  duplicate: "Duplicate",
  delete: "Delete",
  end: "End program",
};

const DESTRUCTIVE: RowAction[] = ["delete", "end"];

// Open/View land on the Edit page (read-only for Ended). Draft Edit/Publish resume the wizard, which
// is where a Draft's content, targets and schedule are still set.
function hrefFor(action: RowAction, id: string): string | null {
  switch (action) {
    case "edit":
    case "publish":
      return `/media-workspace/program/create?id=${id}`;
    case "open":
    case "view":
      return `/media-workspace/program/${id}/edit`;
    default:
      return null;
  }
}

export function PublicationRowActions({
  item,
  busy,
  onAction,
}: {
  item: PublicationListItem;
  busy: boolean;
  /** Only the actions that need a request or a confirm: duplicate, delete, end. */
  onAction: (action: "duplicate" | "delete" | "end", item: PublicationListItem) => void;
}) {
  const [primary, ...rest] = rowActionsFor(item.display_status);
  const primaryHref = hrefFor(primary, item.id);

  return (
    <div className="flex items-center justify-end gap-1">
      {primaryHref && (
        <Link
          href={primaryHref}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 text-xs")}
        >
          {LABELS[primary]}
        </Link>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={busy}
            aria-label={`Actions for ${item.name}`}
          >
            <MoreIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {rest.map((action) => {
            const href = hrefFor(action, item.id);
            const isDestructive = DESTRUCTIVE.includes(action);
            const menuItem = href ? (
              <DropdownMenuItem
                key={action}
                asChild
              >
                <Link href={href}>{LABELS[action]}</Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                key={action}
                className={isDestructive ? "text-danger focus:text-danger" : undefined}
                onSelect={() => onAction(action as "duplicate" | "delete" | "end", item)}
              >
                {LABELS[action]}
              </DropdownMenuItem>
            );
            return isDestructive ? (
              <Fragment key={action}>
                <DropdownMenuSeparator />
                {menuItem}
              </Fragment>
            ) : (
              menuItem
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
