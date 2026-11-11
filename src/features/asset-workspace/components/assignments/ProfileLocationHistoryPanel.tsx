import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, ExternalLinkIcon, LocationIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { ASSIGNMENT_EVENT_TONE } from "../../domain/assignment-history";
import { locationHistoryPath } from "../../domain/assignment-location-history";
import type { LocationHistoryEvent, LocationHistoryReference } from "../../services/asset-assignments-location-history";
import { AssignmentHistoryPerson, AssignmentHistoryTime } from "./AssignmentsHistoryValues";
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
  const previousDisabled = pending || position <= 1;
  const nextDisabled = pending || position >= total;
  return (
    <Card role="complementary" aria-label="Location Change Detail" aria-busy={pending}
      className="@container/location-panel min-w-0 space-y-3 overscroll-contain p-3 text-xs focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
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
      {event && action ? (
        <>
          <dl className="grid grid-cols-[minmax(0,1fr)_max-content_minmax(0,1.25fr)] gap-2 rounded-control bg-accent/50 p-3">
            <div className="space-y-1">
              <dt className="text-muted-foreground">Date &amp; Time</dt>
              <dd><AssignmentHistoryTime at={event.at} /></dd>
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
        </>
      ) : <ProfileLocationDetailLoading />}
    </Card>
  );
}
