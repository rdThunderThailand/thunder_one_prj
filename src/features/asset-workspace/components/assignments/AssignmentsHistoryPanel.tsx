"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/lovable/button";
import { XIcon } from "@/components/ui/icons";
import { Card } from "@/components/ui/Card";
import { assignmentEvidenceState, assignmentHistoryDate, assignmentHistoryReason } from "../../domain/assignment-history";
import type { AssignmentHistoryEvent } from "../../services/asset-assignments-contract";
import { AssignmentEventPill, AssignmentHistoryCondition, AssignmentHistoryPerson } from "./AssignmentsHistoryValues";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-start gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 whitespace-pre-wrap wrap-anywhere">{children}</dd>
    </div>
  );
}

export function AssignmentsHistoryPanel({ event, expiresAt, onClose, onRefresh, refreshing, category, eventMeta }: {
  event: AssignmentHistoryEvent;
  expiresAt: string;
  onClose: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  category?: string;
  eventMeta?: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [event.action, event.id]);
  useEffect(() => {
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, Date.parse(expiresAt) - Date.now()) + 1);
    return () => clearTimeout(timer);
  }, [expiresAt]);
  const expired = now >= Date.parse(expiresAt);
  const unavailable = event.evidence.some((file) => !file.url);
  const time = assignmentHistoryDate(event.at);
  return (
    <Card data-list-aside role="complementary" aria-labelledby="assignment-event-title"
      onKeyDown={(press) => { if (press.key === "Escape") onClose(); }}
      className="relative min-h-0 min-w-0 overscroll-contain p-4 text-xs focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none group-data-[bounded=true]/list-viewport:overflow-y-auto">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 id="assignment-event-title" ref={heading} tabIndex={-1} className="text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Assignment Event Details
        </h2>
        <Button variant="ghost" size="icon-sm" aria-label="Close event details" onClick={onClose}>
          <XIcon aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <div className={eventMeta ? "mb-4 flex flex-wrap gap-1" : "mb-4"}>
        <AssignmentEventPill action={event.action} />
        {eventMeta}
      </div>
      <dl className="space-y-3">
        <Detail label="Date & Time">
          <time dateTime={event.at} className="tabular-nums text-foreground">
            {time.date} {time.time}
          </time>
        </Detail>
        <Detail label="Performed By">
          <AssignmentHistoryPerson person={event.performedBy} fallback="System" />
        </Detail>
        <Detail label="From Custodian">
          <AssignmentHistoryPerson person={event.from} />
        </Detail>
        <Detail label="To Custodian">
          <AssignmentHistoryPerson person={event.to} fallback={event.action === "Return" ? "Unassigned" : "—"} />
        </Detail>
        <Detail label="Location">{event.location?.name || "—"}</Detail>
        <Detail label="Condition at Return">
          <AssignmentHistoryCondition condition={event.action === "Return" ? event.condition : null} />
        </Detail>
        <Detail label="Notes / Reason">{assignmentHistoryReason(event.reason)}</Detail>
      </dl>
      <section className="mt-4 space-y-2" aria-label="Evidence">
        <h3 className="font-medium text-muted-foreground">Evidence</h3>
        {!event.evidence.length ? <p>No evidence attached.</p> : (
          <ul className="space-y-2">
            {event.evidence.map((file) => (
              <li key={file.fileId} className="wrap-anywhere">
                {assignmentEvidenceState(file.url, expiresAt, now) === "available" ? (
                  <a href={file.url!} target="_blank" rel="noopener noreferrer" download={file.filename}
                    className="rounded-control text-accent-foreground underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring">
                    {file.filename}
                  </a>
                ) : <span>{file.filename}</span>}
              </li>
            ))}
          </ul>
        )}
        {event.evidence.length > 0 && (expired || unavailable) && (
          <div role="status" className="space-y-2 text-muted-foreground">
            <p>{expired ? "File links have expired. Refresh history to download." : "File unavailable. Refresh history to try again."}</p>
            <Button size="sm" variant="outline" disabled={refreshing} onClick={onRefresh}>Refresh history</Button>
          </div>
        )}
      </section>
      <section className="mt-4 border-t border-border pt-4" aria-labelledby="assignment-related-title">
        <h3 id="assignment-related-title" className="mb-3 font-semibold">Related Information</h3>
        <dl className="space-y-3">
          <Detail label="Asset Name">{event.asset.name}</Detail>
          <Detail label="Asset Tag">{event.asset.assetTag || "—"}</Detail>
          {category !== undefined && <Detail label="Category">{category}</Detail>}
        </dl>
      </section>
    </Card>
  );
}
