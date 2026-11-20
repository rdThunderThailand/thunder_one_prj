"use client";

import Link from "next/link";
import type { AssignmentHistoryEvent } from "../../services/asset-assignments-contract";
import { ChevronRightIcon } from "@/components/ui/icons";
import { assignmentEventKey, assignmentHistoryReason } from "../../domain/assignment-history";
import { profileHref } from "../../domain/assignment-assign";
import { assignmentHistoryColumns, HISTORY_DETAILS_COLUMN } from "./assignment-history-columns";
import { AssignmentEventPill, AssignmentHistoryCondition, AssignmentHistoryPerson, AssignmentHistoryTime } from "./AssignmentsHistoryValues";

export function AssignmentsHistoryTable({ rows, selectedKey, onSelect }: {
  rows: AssignmentHistoryEvent[];
  selectedKey?: string;
  onSelect: (event: AssignmentHistoryEvent, opener: HTMLElement) => void;
}) {
  return (
    <table className="relative w-full min-w-6xl table-fixed text-left text-xs">
      <caption className="sr-only">Assignment history records, newest first. Select a row to see its details.</caption>
      <colgroup>
        {assignmentHistoryColumns.map((column) => (
          <col key={column.label} className={column.width} />
        ))}
      </colgroup>
      <thead className="sticky top-0 z-10 bg-muted text-2xs text-muted-foreground">
        <tr>
          {assignmentHistoryColumns.map(({ label: heading }) => (
            <th key={heading} scope="col" aria-sort={heading === "Date & Time" ? "descending" : undefined}
              title={heading === "Date & Time" ? "Newest first" : undefined}
              className="border-b border-border px-3 py-3 font-semibold">
              {heading === HISTORY_DETAILS_COLUMN ? <span className="sr-only">{heading}</span> : heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((event) => {
          const key = assignmentEventKey(event);
          return (
            <tr key={key} tabIndex={0} aria-selected={key === selectedKey}
              onClick={(click) => onSelect(event, click.currentTarget)}
              onKeyDown={(press) => {
                if (press.target !== press.currentTarget || !["Enter", " "].includes(press.key)) return;
                press.preventDefault();
                onSelect(event, press.currentTarget);
              }}
              className={`group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${key === selectedKey
                ? "bg-accent [&>td:first-child]:border-l-2 [&>td:first-child]:border-primary"
                : "hover:bg-muted/50 focus-within:bg-muted/50"} [&>td]:px-3 [&>td]:py-2.5 [&>td]:align-middle [&>td]:wrap-anywhere`}>
              <td>
                <div className="min-w-0 space-y-0.5">
                  <Link href={profileHref(event.asset.id, true)} onClick={(click) => click.stopPropagation()}
                    className="block rounded-control font-semibold text-foreground underline-offset-4 hover:text-accent-foreground hover:underline">
                    {event.asset.name}
                  </Link>
                  {event.asset.assetTag && (
                    <p className="text-2xs tabular-nums text-muted-foreground">{event.asset.assetTag}</p>
                  )}
                </div>
              </td>
              <td>
                <AssignmentEventPill action={event.action} />
              </td>
              <td className="text-muted-foreground">
                <AssignmentHistoryPerson person={event.from} />
              </td>
              <td className="text-muted-foreground">
                <AssignmentHistoryPerson person={event.to} fallback={event.action === "Return" ? "Unassigned" : "—"} />
              </td>
              <td>
                <AssignmentHistoryTime at={event.at} />
              </td>
              <td>{event.location?.name || "—"}</td>
              <td className="text-muted-foreground">
                <AssignmentHistoryCondition condition={event.action === "Return" ? event.condition : null} />
              </td>
              <td className="text-muted-foreground">
                <AssignmentHistoryPerson person={event.performedBy} fallback="System" />
              </td>
              <td className="text-muted-foreground">
                <p className="line-clamp-2 whitespace-pre-wrap" title={assignmentHistoryReason(event.reason)}>
                  {assignmentHistoryReason(event.reason)}
                </p>
              </td>
              <td className="text-center">
                <ChevronRightIcon aria-hidden="true" className="inline size-4 text-muted-foreground group-hover:text-foreground" />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
