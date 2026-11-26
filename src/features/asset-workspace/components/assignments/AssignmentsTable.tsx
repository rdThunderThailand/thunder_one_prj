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
import { ConditionBadge } from "../StatusBadges";
import { AssignmentRowMenu } from "./AssignmentRowMenu";
import { assignmentTableColumns } from "./assignment-table-columns";

export function AssignmentsTable({ rows }: { rows: CurrentAssignment[] }) {
  const router = useRouter();
  const refreshed = useRef(new Set<string>());
  const [openId, setOpenId] = useState<string | null>(null);
  // Row whose menu was open when the pointer went down: the menu's outside-dismiss closes it, and the click must not reopen it.
  const closing = useRef<string | null>(null);
  return (
    <table className="w-full min-w-xl table-fixed text-left text-xs">
      <caption className="sr-only">Assets with a current custodian. Use the Actions button in each row.</caption>
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
            className={`cursor-pointer transition-colors duration-150 motion-reduce:transition-none ${openId === row.assignmentId ? "bg-accent" : "hover:bg-muted/50"}`}
            onPointerDown={() => { closing.current = openId === row.assignmentId ? row.assignmentId : null; }}
            onClick={(event) => {
              const target = event.target as Element;
              if (closing.current === row.assignmentId) {
                closing.current = null;
                return;
              }
              // Links and buttons keep their own click; dragging to copy text doesn't open the menu.
              if (target.closest("a, button, [role=menu]") || window.getSelection()?.toString()) return;
              setOpenId(row.assignmentId);
            }}
          >
            <td className="px-4 py-2.5 align-middle">
              <div className="flex min-w-0 items-center gap-3">
                <AssetThumbnail
                  src={row.asset.thumbnailUrl}
                  alt=""
                  className="size-10"
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
                  <p className="truncate text-2xs text-muted-foreground" title={row.asset.serialNumber ?? undefined}>
                    {row.asset.serialNumber ? (
                      <>
                        <span className="sr-only">Serial Number: </span>
                        SN {row.asset.serialNumber}
                      </>
                    ) : "No serial number"}
                  </p>
                  <p className="text-2xs text-muted-foreground wrap-anywhere @4xl/assignments:hidden">
                    {row.asset.category?.name || "Unnamed category"}
                  </p>
                  <p className="text-2xs text-muted-foreground @5xl/assignments:hidden">
                    {assignmentDate(row.assignedAt)}
                  </p>
                  {(row.asset.condition === "Damaged" || row.asset.condition === "Unusable") && (
                    <ConditionBadge condition={row.asset.condition} />
                  )}
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
            <td className="px-4 py-2.5 text-center align-middle">
              <AssignmentRowMenu
                row={row}
                open={openId === row.assignmentId}
                onOpenChange={(open) => setOpenId(open ? row.assignmentId : null)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
