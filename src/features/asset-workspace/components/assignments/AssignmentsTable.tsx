"use client";

import Link from "next/link";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { UsersIcon } from "@/components/ui/icons";
import { AssetThumbnail } from "../AssetThumbnail";
import { assignmentDate } from "../../domain/assignment-current";
import { profileHref } from "../../domain/assignment-assign";
import type { CurrentAssignment } from "../../services/asset-assignments-contract";
import { AssignmentRowMenu } from "./AssignmentRowMenu";
import { assignmentTableColumns } from "./assignment-table-columns";

export function AssignmentsTable({ rows }: { rows: CurrentAssignment[] }) {
  const router = useRouter();
  const refreshed = useRef(new Set<string>());

  return (
    <table className="w-full min-w-xl table-fixed text-left text-xs">
      <caption className="sr-only">Assets with a current custodian</caption>
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
          <tr key={row.assignmentId} className="hover:bg-muted/50 focus-within:bg-muted/50">
            <td className="px-4 py-2.5 align-middle">
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
            <td className="relative px-4 py-2 text-right align-middle">
              <AssignmentRowMenu row={row} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
