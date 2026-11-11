import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { ChevronDownIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ASSIGNMENT_EVENT_TONE, assignmentEventKey, assignmentHistoryReason, assignmentHistoryRowNumber,
} from "../../domain/assignment-history";
import { STATUS_TONE } from "../../domain/status-tone";
import type { ProfileAssignmentEvent } from "../../services/asset-assignments-profile-api";
import { formatDay } from "../asset-profile/ProfileParts";
import {
  AssignmentEventPill, AssignmentHistoryCondition, AssignmentHistoryPerson, AssignmentHistoryTime,
} from "./AssignmentsHistoryValues";

const custodyColumns = ["#", "Custodian", "From", "To", "Location", "Action", "Notes", "By"];
const historyColumns = ["#", "Event Type", "From", "To / Custodian", "Date & Time", "Location", "Condition at Return", "Performed By", "Notes / Reason"];
const widths = {
  custody: ["w-9", "w-36", "w-24", "w-28", "w-32", "w-24", "w-36", "w-36"],
  history: ["w-9", "w-28", "w-32", "w-32", "w-28", "w-28", "w-24", "w-32", "w-36"],
};

export function CurrentAssignmentBadge() {
  return <Badge color={STATUS_TONE.Available} variant="pill" className="whitespace-nowrap">Current</Badge>;
}

function historyCells(event: ProfileAssignmentEvent, current: boolean): ReactNode[] {
  return [
    <div key="event" className="flex flex-wrap gap-1">
      <AssignmentEventPill action={event.action} />
      {current && <CurrentAssignmentBadge />}
    </div>,
    <AssignmentHistoryPerson key="from" person={event.from} />,
    <AssignmentHistoryPerson key="to" person={event.to} fallback={event.action === "Return" ? "Unassigned" : "—"} />,
    <AssignmentHistoryTime key="time" at={event.at} />,
    event.location?.name || "—",
    <AssignmentHistoryCondition key="condition" condition={event.action === "Return" ? event.condition : null} />,
    <AssignmentHistoryPerson key="actor" person={event.performedBy} fallback="System" />,
    assignmentHistoryReason(event.reason),
  ];
}

function custodyCells(event: ProfileAssignmentEvent, current: boolean): ReactNode[] {
  return [
    <AssignmentHistoryPerson key="holder" person={event.to} fallback="Unassigned" />,
    formatDay(event.custodyPeriod?.startedAt ?? null),
    <div key="end" className="flex flex-wrap items-center gap-1">
      {formatDay(event.action === "Return" ? event.at : event.custodyPeriod?.endedAt ?? null)}
      {current && <CurrentAssignmentBadge />}
    </div>,
    event.location?.name || "—",
    <Badge key="action" color={ASSIGNMENT_EVENT_TONE[event.action]} variant="pill" className="whitespace-nowrap">
      {event.action}
    </Badge>,
    assignmentHistoryReason(event.reason),
    <div key="actor" className="space-y-1">
      <AssignmentHistoryPerson person={event.performedBy} fallback="System" />
      <AssignmentHistoryTime at={event.at} />
    </div>,
  ];
}

export function ProfileAssignmentEventsTable({ history, rows = [], page = 1, pageSize = 20, selectedKey, currentKey,
  loading = false, onSelect }: {
  history: boolean; rows?: ProfileAssignmentEvent[]; page?: number; pageSize?: number; selectedKey?: string;
  currentKey?: string; loading?: boolean; onSelect?: (event: ProfileAssignmentEvent, opener: HTMLElement) => void;
}) {
  const columns = history ? historyColumns : custodyColumns;
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className={`relative w-full table-fixed text-left text-xs ${history ? "min-w-4xl" : "min-w-3xl"}`}>
        <caption className="sr-only">{history ? "Assignment history records" : "Assignments"}</caption>
        <colgroup>
          {widths[history ? "history" : "custody"].map((width, index) => <col key={columns[index]} className={width} />)}
        </colgroup>
        <thead className="bg-muted text-2xs text-muted-foreground">
          <tr>
            {columns.map((heading) => (
              <th key={heading} scope="col" aria-sort={heading === "Date & Time" ? "descending" : undefined}
                className="border-b border-border px-3 py-3 font-semibold">
                {heading}
                {heading === "Date & Time" && <ChevronDownIcon aria-hidden="true" className="ml-1 inline size-3" />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? Array.from({ length: 5 }, (_, index) => (
            <tr key={index} aria-hidden="true">
              {columns.map((column) => (
                <td key={column} className="px-3 py-4">
                  <Skeleton className="h-5 w-full motion-reduce:animate-none" />
                </td>
              ))}
            </tr>
          )) : rows.map((event, index) => {
            const key = assignmentEventKey(event);
            const cells = history ? historyCells(event, key === currentKey) : custodyCells(event, key === currentKey);
            return (
              <tr key={key} tabIndex={onSelect ? 0 : undefined} aria-selected={onSelect ? key === selectedKey : undefined}
                onClick={onSelect ? (click) => onSelect(event, click.currentTarget) : undefined}
                onKeyDown={onSelect ? (press) => {
                  if (press.target !== press.currentTarget || (press.key !== "Enter" && press.key !== " ")) return;
                  press.preventDefault();
                  onSelect(event, press.currentTarget);
                } : undefined}
                className={`outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${key === selectedKey
                  ? "bg-accent [&>td:first-child]:border-l-2 [&>td:first-child]:border-primary"
                  : "hover:bg-muted/50"}`}>
                <td className="px-3 py-3 align-top tabular-nums">{assignmentHistoryRowNumber(page, pageSize, index)}</td>
                {cells.map((cell, cellIndex) => (
                  <td key={columns[cellIndex + 1]} className="whitespace-pre-wrap px-3 py-3 align-top wrap-anywhere">{cell}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
