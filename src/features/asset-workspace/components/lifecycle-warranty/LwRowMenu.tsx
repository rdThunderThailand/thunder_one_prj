"use client";

import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import { MoreIcon, type Icon as IconType } from "@/components/ui/icons";
import type { RowMenuItem } from "../../domain/lifecycle-list";

/** The row's "…" menu. A greyed item keeps its reason as a muted tag, as the Assets Update Status menu. */
export function LwRowMenu({ name, items, icons }: {
  name: string; items: RowMenuItem[]; icons: Record<string, IconType>;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${name}`}
          className="flex size-8 items-center justify-center rounded-control text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
        >
          <MoreIcon aria-hidden="true" className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} collisionPadding={8} className="min-w-52 max-w-80">
        {items.map((item) => {
          const Icon = icons[item.key];
          return item.reason ? (
            <DropdownMenuItem key={item.key} disabled>
              {Icon && <Icon aria-hidden="true" />}
              {item.label}
              <span className="ml-auto rounded-control bg-muted px-1.5 py-0.5 text-2xs text-muted-foreground">{item.reason}</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={item.key} asChild>
              <Link href={item.href}>
                {Icon && <Icon aria-hidden="true" />}
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
