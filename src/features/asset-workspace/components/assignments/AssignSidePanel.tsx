import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowRightIcon, CheckCircleIcon, InfoIcon, LocationIcon, TransferIcon } from "@/components/ui/icons";
import { locationTrail } from "../../domain/asset-profile";
import { assignmentDate } from "../../domain/assignment-current";
import { assignOutcomes } from "../../domain/assignment-assign";
import { AssetThumbnail } from "../AssetThumbnail";
import { AssignHolder } from "./AssignHolder";
import type { AssignFlow } from "./use-assign-flow";

/** Frame 16's right column: live summary, fixed outcomes, last three custody events. */
export function AssignSidePanel({ flow }: { flow: AssignFlow }) {
  const { asset, target, recent } = flow;
  const location = asset ? locationTrail(asset.locationPath, asset.location) || null : null;
  return (
    <aside
      aria-label="Assign summary"
      className="min-w-0 space-y-3"
    >
      <Card className="space-y-3 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <TransferIcon
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
          Assign Summary
        </h2>
        {asset ? (
          <div className="flex min-w-0 items-center gap-3">
            <AssetThumbnail
              src={flow.picked?.thumbnailUrl ?? null}
              className="size-12"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground wrap-anywhere">{asset.name}</p>
              <p className="text-2xs text-muted-foreground wrap-anywhere">{asset.assetTag}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Select an asset to see the summary.</p>
        )}
        <div className="space-y-2 rounded-control bg-muted p-3">
          <p className="text-2xs font-medium text-muted-foreground">From (Current)</p>
          <p className="text-xs text-foreground">No current custodian</p>
          <p className="flex items-center gap-1 text-2xs text-muted-foreground wrap-anywhere">
            <LocationIcon
              aria-hidden="true"
              className="size-3 shrink-0"
            />
            {location ?? "No location"}
          </p>
        </div>
        <ArrowRightIcon
          aria-hidden="true"
          className="mx-3 size-4 rotate-90 text-muted-foreground"
        />
        <div
          aria-live="polite"
          className="space-y-2 rounded-control bg-muted p-3"
        >
          <p className="text-2xs font-medium text-muted-foreground">To (New)</p>
          {target ? (
            <AssignHolder
              type={target.type}
              name={target.name}
              secondary={target.secondary}
            />
          ) : (
            <p className="text-xs text-muted-foreground">Choose a person or team</p>
          )}
        </div>
      </Card>
      <Card className="space-y-2 p-4">
        <h2 className="text-sm font-semibold text-foreground">What will happen?</h2>
        <ul className="space-y-2 text-xs text-foreground">
          {assignOutcomes(target?.name ?? null, location).map((line) => (
            <li
              key={line}
              className="flex items-start gap-2"
            >
              <CheckCircleIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-success"
              />
              {line}
            </li>
          ))}
          <li className="flex items-start gap-2">
            <InfoIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-accent-foreground"
            />
            Recorded in Assignment History and Audit Log
          </li>
        </ul>
      </Card>
      <Card className="space-y-2 p-4">
        <h2 className="text-sm font-semibold text-foreground">Recent Assignment History</h2>
        {!flow.assetId ? (
          <p className="text-xs text-muted-foreground">Select an asset to see its history.</p>
        ) : !recent.result ? (
          <Skeleton className="h-16 w-full" />
        ) : !recent.result.ok ? (
          <p className="text-xs text-muted-foreground">Couldn&apos;t load recent history.</p>
        ) : recent.result.data.data.length === 0 ? (
          <p className="text-xs text-muted-foreground">No earlier assignments</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.result.data.data.map((event) => {
              const holder = event.to ?? event.from;
              return (
                <li
                  key={`${event.action}:${event.id}`}
                  className="flex min-w-0 items-start justify-between gap-3 py-2"
                >
                  {holder ? (
                    <AssignHolder
                      type={holder.type}
                      name={holder.name}
                      avatarUrl={holder.avatarUrl}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">No custodian</span>
                  )}
                  <span className="shrink-0 text-right text-2xs text-muted-foreground">
                    <span className="block">{event.action}</span>
                    <time
                      dateTime={event.at}
                      title={event.at}
                    >
                      {assignmentDate(event.at)}
                    </time>
                    {event.location?.name && <span className="block wrap-anywhere">{event.location.name}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </aside>
  );
}
