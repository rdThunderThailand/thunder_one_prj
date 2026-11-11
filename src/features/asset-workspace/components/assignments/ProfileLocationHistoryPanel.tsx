import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, ExternalLinkIcon, LocationIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { ASSIGNMENT_EVENT_TONE, assignmentHistoryDate } from "../../domain/assignment-history";
import { locationHistoryPath } from "../../domain/assignment-location-history";
import type { LocationHistoryEvent, LocationHistoryReference } from "../../services/asset-assignments-location-history";
import { SectionMessage } from "../asset-profile/ProfileParts";
import { AssignmentHistoryPerson } from "./AssignmentsHistoryValues";
import { ProfileLocationDetailLoading } from "./ProfileLocationHistoryLoading";

const actions = {
  register: { label: "Initial location", tone: ASSIGNMENT_EVENT_TONE.Assign },
  move: { label: "Move to", tone: ASSIGNMENT_EVENT_TONE.Transfer },
  transfer: { label: "Transfer", tone: ASSIGNMENT_EVENT_TONE.Transfer },
} as const;

function LocationEndpoint({ title, location, locations, link = false }: {
  title: string;
  location: LocationHistoryReference | null;
  locations: ReadonlyMap<string, LocationHistoryReference>;
  link?: boolean;
}) {
  const path = locationHistoryPath(location, locations);
  return (
    <div className="flex min-w-0 items-start gap-2">
      <span className="grid size-7 shrink-0 place-items-center rounded-control bg-muted text-accent-foreground">
        <LocationIcon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 space-y-1 wrap-anywhere">
        <dt className="text-muted-foreground">{title}</dt>
        <dd className="font-semibold">{location?.name || "—"}</dd>
        {(location?.name ? path.slice(0, -1) : path).map((name, index) => (
          <dd key={index} className="text-muted-foreground">{name}</dd>
        ))}
        {link && location && (
          <dd>
            <Link href={`/asset-workspace/locations/${encodeURIComponent(location.id)}`}
              className="inline-flex min-h-8 items-center gap-1 whitespace-nowrap rounded-control font-semibold text-accent-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring">
              View Location
              <ExternalLinkIcon aria-hidden="true" className="size-3 shrink-0" />
            </Link>
          </dd>
        )}
      </div>
    </div>
  );
}

export function ProfileLocationHistoryPanel({ event, position, total, locations, pending, onStep }: {
  event: LocationHistoryEvent | null;
  position: number;
  total: number;
  locations: ReadonlyMap<string, LocationHistoryReference>;
  pending: boolean;
  onStep: (step: -1 | 1) => void;
}) {
  const action = event ? actions[event.source] : null;
  const time = event ? assignmentHistoryDate(event.at) : null;
  const previousDisabled = pending || position <= 1;
  const nextDisabled = pending || position >= total;
  return (
    <Card role="complementary" aria-label="Location Change Detail" aria-busy={pending}
      className="@container/location-panel min-w-0 space-y-4 overscroll-contain p-4 text-xs focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <ClockIcon aria-hidden="true" className="size-4 shrink-0" />
          <span className="min-w-0 truncate" title="Location Change Detail">Location Change Detail</span>
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="icon-sm" aria-label="Previous location change" aria-disabled={previousDisabled}
            className="aria-disabled:opacity-50" onClick={() => { if (!previousDisabled) onStep(-1); }}>
            <ChevronLeftIcon aria-hidden="true" className="size-4" />
          </Button>
          <span role="status" className="whitespace-nowrap tabular-nums">{total > 0 ? `${position} / ${total}` : "—"}</span>
          <Button variant="outline" size="icon-sm" aria-label="Next location change" aria-disabled={nextDisabled}
            className="aria-disabled:opacity-50" onClick={() => { if (!nextDisabled) onStep(1); }}>
            <ChevronRightIcon aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
      {event && action && time ? (
        <>
          <dl className="grid grid-cols-[minmax(0,1fr)_max-content_minmax(0,1.25fr)] items-start gap-3 rounded-control bg-accent/50 p-3">
            <div className="space-y-1">
              <dt className="text-muted-foreground">Date &amp; Time</dt>
              <dd>
                <time dateTime={event.at} className="font-semibold tabular-nums text-foreground">
                  {time.date} {time.time}
                </time>
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground">Action</dt>
              <dd><Badge color={action.tone} variant="pill" className="whitespace-nowrap">{action.label}</Badge></dd>
            </div>
            <div className="min-w-0 space-y-1">
              <dt className="text-muted-foreground">By</dt>
              <dd><AssignmentHistoryPerson person={event.performedBy} fallback="System" /></dd>
            </div>
          </dl>
          <dl className="grid items-start gap-2 @xs/location-panel:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <LocationEndpoint title="From Location" location={event.from} locations={locations} />
            <div aria-hidden="true" className="pt-2 text-muted-foreground">
              <ArrowRightIcon className="size-4 rotate-90 @xs/location-panel:rotate-0" />
            </div>
            <LocationEndpoint title="To Location" location={event.to} locations={locations} link />
          </dl>
          <div className="space-y-2 border-t border-border pt-3">
            <h3 className="text-xs font-semibold text-foreground">Location Map (To Location)</h3>
            <div aria-disabled="true" className="flex min-h-36 items-start rounded-control border border-dashed border-border bg-muted/40 p-4 opacity-60">
              <SectionMessage>Map is not available in this version.</SectionMessage>
            </div>
          </div>
        </>
      ) : <ProfileLocationDetailLoading />}
    </Card>
  );
}
