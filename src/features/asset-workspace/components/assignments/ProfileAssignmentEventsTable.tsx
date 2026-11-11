import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { UserIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ASSIGNMENT_EVENT_TONE, assignmentEventKey, assignmentHistoryDate, assignmentHistoryReason, assignmentHistoryRowNumber,
} from "../../domain/assignment-history";
import { STATUS_TONE } from "../../domain/status-tone";
import { locationHistoryPath } from "../../domain/assignment-location-history";
import type { ProfileAssignmentEvent } from "../../services/asset-assignments-profile-api";
import type { LocationHistoryEvent, LocationHistoryReference } from "../../services/asset-assignments-location-history";
import { formatDay } from "../asset-profile/ProfileParts";
import {
  AssignmentEventPill, AssignmentHistoryCondition, AssignmentHistoryPerson, AssignmentHistoryTime,
} from "./AssignmentsHistoryValues";

const custodyColumns = ["#", "Custodian", "From", "To", "Location", "Action", "Notes", "By"];
const historyColumns = ["#", "Event Type", "From", "To / Custodian", "Date & Time", "Location", "Condition at Return", "Performed By", "Notes / Reason"];
const locationColumns = ["#", "Date & Time", "From Location", "To Location", "By", "Reason"];
const widths = {
  custody: ["w-9", "w-40", "w-24", "w-28", "w-36", "w-24", "w-44", "w-56"],
  history: ["w-8", "w-28", "w-36", "w-40", "w-28", "w-28", "w-24", "w-40", "w-36"],
  location: ["w-9", "w-28", "w-32", "w-32", "w-44", "w-36"],
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
  const time = assignmentHistoryDate(event.at);
  return [
    event.to?.name ? <AssignmentHistoryPerson key="holder" person={event.to} /> : (
      <div key="holder" className="flex min-w-0 items-center gap-2">
        <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UserIcon className="size-4" />
        </span>
        <span className="text-muted-foreground">Unassigned</span>
      </div>
    ),
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
    // Frame 04: actor and time share one line; the time wraps under the name when the column is narrow.
    <div key="actor" className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
      <div className="min-w-0 flex-1 basis-24">
        <AssignmentHistoryPerson person={event.performedBy} fallback="System" />
      </div>
      <time dateTime={event.at} className="shrink-0 whitespace-nowrap text-2xs tabular-nums text-muted-foreground">
        {time.date} {time.time}
      </time>
    </div>,
  ];
}

type TableProps = { page?: number; pageSize?: number; selectedKey?: string; loading?: boolean } & (
  | { variant?: never; history: boolean; rows?: ProfileAssignmentEvent[]; currentKey?: string;
    onSelect?: (event: ProfileAssignmentEvent, opener: HTMLElement) => void }
  | { variant: "location"; rows?: LocationHistoryEvent[];
    locations: ReadonlyMap<string, LocationHistoryReference>;
    onSelect?: (event: LocationHistoryEvent, opener: HTMLElement) => void }
);

function tableRows(props: TableProps) {
  if (props.variant === "location") {
    return (props.rows ?? []).map((event) => ({
      key: event.id,
      cells: [
        <AssignmentHistoryTime key="time" at={event.at} />,
        locationHistoryPath(event.from, props.locations).join(" › ") || "—",
        locationHistoryPath(event.to, props.locations).join(" › ") || "—",
        <AssignmentHistoryPerson key="actor" person={event.performedBy} fallback="System" />,
        event.reason || "—",
      ],
      select: props.onSelect ? (opener: HTMLElement) => props.onSelect?.(event, opener) : undefined,
    }));
  }
  return (props.rows ?? []).map((event) => {
    const key = assignmentEventKey(event);
    const current = key === props.currentKey;
    return { key, cells: props.history ? historyCells(event, current) : custodyCells(event, current),
      select: props.onSelect ? (opener: HTMLElement) => props.onSelect?.(event, opener) : undefined };
  });
}

export function ProfileAssignmentEventsTable(props: TableProps) {
  const { page = 1, pageSize = 20, selectedKey, loading = false } = props;
  const variant = props.variant === "location" ? "location" : props.history ? "history" : "custody";
  const columns = variant === "location" ? locationColumns : variant === "history" ? historyColumns : custodyColumns;
  const caption = variant === "location" ? "Location history records" : variant === "history" ? "Assignment history records" : "Assignments";
  const minimumWidth = variant === "location" ? "min-w-2xl" : variant === "history" ? "min-w-4xl" : "min-w-3xl";
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className={`relative w-full table-fixed text-left text-xs ${minimumWidth}`}>
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          {widths[variant].map((width, index) => <col key={columns[index]} className={width} />)}
        </colgroup>
        <thead className="bg-muted text-2xs text-muted-foreground">
          <tr>
            {columns.map((heading) => (
              <th key={heading} scope="col" aria-sort={heading === "Date & Time" ? "descending" : undefined}
                className="border-b border-border px-3 py-3 font-semibold">
                {heading}
                {variant === "history" && heading === "Date & Time" && <span aria-hidden="true"> ↓</span>}
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
          )) : tableRows(props).map(({ key, cells, select }, index) => {
            return (
              <tr key={key} tabIndex={select ? 0 : undefined} aria-selected={select ? key === selectedKey : undefined}
                onClick={select ? (click) => select(click.currentTarget) : undefined}
                onKeyDown={select ? (press) => {
                  if (press.target !== press.currentTarget || (press.key !== "Enter" && press.key !== " ")) return;
                  press.preventDefault();
                  select(press.currentTarget);
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
