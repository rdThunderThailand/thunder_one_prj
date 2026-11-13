"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { UsersIcon } from "@/components/ui/icons";
import { AssetThumbnail } from "../AssetThumbnail";
import { assignmentDate } from "../../domain/assignment-current";
import { profileHref } from "../../domain/assignment-assign";
import type { CurrentAssignment } from "../../services/asset-assignments-contract";
import { AssignmentRowMenu, type RowMenuAnchor } from "./AssignmentRowMenu";
import { assignmentTableColumns } from "./assignment-table-columns";

export function AssignmentsTable({ rows }: { rows: CurrentAssignment[] }) {
  const router = useRouter();
  const refreshed = useRef(new Set<string>());
  // The anchor outlives `open` so a closing menu fades out in place instead of jumping to the default spot.
  const [menu, setMenu] = useState<RowMenuAnchor & { id: string; open: boolean } | null>(null);
  const openId = menu?.open ? menu.id : null;
  const close = (id: string) => setMenu((current) => current?.id === id ? { ...current, open: false } : current);
  // Row whose menu was open when the pointer went down: the menu's outside-dismiss closes it, and the click must not reopen it.
  const closing = useRef<string | null>(null);
  // Anchor inside the row's first cell: the click point, or the row's right end when opened from the keyboard.
  const openMenu = (id: string, cell: HTMLElement, x?: number, y?: number) => {
    const box = cell.getBoundingClientRect();
    const rowBox = cell.closest("tr")!.getBoundingClientRect();
    setMenu({ id, open: true, x: (x ?? rowBox.right - 16) - box.left, y: (y ?? rowBox.bottom - 8) - box.top });
  };

  return (
    <table className="w-full min-w-xl table-fixed text-left text-xs">
      <caption className="sr-only">Assets with a current custodian. Select a row for its actions.</caption>
      <thead className="sticky top-0 z-10 bg-muted text-2xs text-muted-foreground">
        <tr>
          {assignmentTableColumns.map((column) => (
            <th key={column.key} scope="col" className={`border-b border-border px-4 py-3 font-semibold ${column.className}`}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((row) => (
          <tr
            key={row.assignmentId}
            data-menu-open={openId === row.assignmentId}
            className={`cursor-pointer transition-colors duration-150 motion-reduce:transition-none has-[[data-row-trigger]:focus-visible]:outline-2 has-[[data-row-trigger]:focus-visible]:-outline-offset-2 has-[[data-row-trigger]:focus-visible]:outline-ring ${openId === row.assignmentId ? "bg-accent" : "hover:bg-muted/50"}`}
            onPointerDown={() => { closing.current = openId === row.assignmentId ? row.assignmentId : null; }}
            onClick={(event) => {
              const target = event.target as Element;
              if (closing.current === row.assignmentId) {
                closing.current = null;
                close(row.assignmentId);
                return;
              }
              // Links and the menu itself keep their own click; dragging to copy text doesn't open the menu.
              if (target.closest("a, button, [role=menu]") || window.getSelection()?.toString()) return;
              openMenu(row.assignmentId, event.currentTarget.cells[0], event.clientX, event.clientY);
            }}
          >
            <td className="relative px-4 py-2.5 align-middle">
              <AssignmentRowMenu
                row={row}
                open={openId === row.assignmentId}
                anchor={menu?.id === row.assignmentId ? menu : null}
                onOpenChange={(open, trigger) => {
                  if (!open) close(row.assignmentId);
                  else if (openId !== row.assignmentId) openMenu(row.assignmentId, trigger.parentElement!);
                }}
              />
              <div className="flex min-w-0 items-center gap-3">
                <AssetThumbnail
                  src={row.asset.thumbnailUrl}
                  alt=""
                  className="size-10 object-contain!"
                  onFailed={() => {
                    if (refreshed.current.has(row.asset.id)) return;
                    refreshed.current.add(row.asset.id);
                    router.refresh();
                  }}
                />
                <div className="min-w-0 space-y-0.5">
                  <Link
                    href={profileHref(row.asset.id, true)}
                    className="block rounded-control font-semibold text-foreground underline-offset-4 wrap-anywhere hover:text-accent-foreground hover:underline"
                  >
                    {row.asset.name || "Unnamed asset"}
                  </Link>
                  <p className="text-2xs text-muted-foreground wrap-anywhere">
                    {row.asset.category?.name || "Unnamed category"}
                  </p>
                  <p className="text-2xs text-muted-foreground @5xl/assignments:hidden">
                    {assignmentDate(row.assignedAt)}
                  </p>
                </div>
              </div>
            </td>
            <td className="px-4 py-2.5 align-middle tabular-nums wrap-anywhere text-muted-foreground">{row.asset.assetTag || "Not available"}</td>
            <td className="hidden px-4 py-2.5 align-middle wrap-anywhere text-muted-foreground @4xl/assignments:table-cell">
              {row.asset.category?.name || "Unnamed category"}
            </td>
            <td className="px-4 py-2.5 align-middle">
              <div className="flex items-center gap-2.5">
                {row.custodian.type === "person" ? (
                  <Avatar name={row.custodian.name || "Unnamed custodian"} src={row.custodian.avatarUrl} size={32} />
                ) : (
                  <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <UsersIcon className="size-4" />
                  </span>
                )}
                <div className="min-w-0 space-y-0.5">
                  <p className="font-semibold wrap-anywhere text-foreground">{row.custodian.name || "Unnamed custodian"}</p>
                  {row.custodian.department?.name && (
                    <p className="text-2xs text-muted-foreground wrap-anywhere">{row.custodian.department.name}</p>
                  )}
                  {row.custodian.type === "org_unit" && (
                    <p className="text-2xs text-muted-foreground">Organizational Unit</p>
                  )}
                </div>
              </div>
            </td>
            <td className="px-4 py-2.5 align-middle wrap-anywhere text-muted-foreground">{row.location?.name || "No location"}</td>
            <td className="hidden px-4 py-2.5 align-middle tabular-nums text-muted-foreground @5xl/assignments:table-cell">
              <time dateTime={row.assignedAt} title={row.assignedAt}>{assignmentDate(row.assignedAt)}</time>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
