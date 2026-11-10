import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowRightIcon, CheckCircleIcon, ClockIcon, InfoIcon, LocationIcon, TransferIcon } from "@/components/ui/icons";
import { assignmentDate } from "../../domain/assignment-current";
import type { ProfileReadResult } from "../../services/asset-profile-api";
import type { AssetDetail } from "../../services/asset-profile-contract";
import type { AssignmentEventsPage } from "../../services/asset-assignments-contract";
import { AssetThumbnail } from "../AssetThumbnail";
import { AssignHolder } from "./AssignHolder";

export type PanelHolder = { type: "person" | "org_unit"; name: string | null; secondary?: string | null; avatarUrl?: string | null };
export type PanelSide = { holder: PanelHolder | null; empty: string; location?: string | null; since?: string | null };

function Side({ label, side, live = false }: { label: string; side: PanelSide; live?: boolean }) {
  return (
    <div
      aria-live={live ? "polite" : undefined}
      className="space-y-2 rounded-control bg-muted p-3"
    >
      <p className="text-2xs font-medium text-muted-foreground">{label}</p>
      {side.holder ? (
        <AssignHolder
          type={side.holder.type}
          name={side.holder.name}
          secondary={side.holder.secondary}
          avatarUrl={side.holder.avatarUrl ?? null}
        />
      ) : (
        <p className="text-xs text-muted-foreground">{side.empty}</p>
      )}
      {side.location !== undefined && (
        <p className="flex items-center gap-1 text-2xs text-muted-foreground wrap-anywhere">
          <LocationIcon
            aria-hidden="true"
            className="size-3 shrink-0"
          />
          {side.location ?? "No location"}
        </p>
      )}
      {side.since && (
        <p className="flex items-center gap-1 text-2xs text-muted-foreground">
          <ClockIcon
            aria-hidden="true"
            className="size-3 shrink-0"
          />
          Since {assignmentDate(side.since)}
        </p>
      )}
    </div>
  );
}

/** Frame 16's right column for FE 02–04: live summary, fixed outcomes, last three custody events. */
export function AssignSidePanel({ title, asset, thumbnailUrl, from, to, outcomes, recent, noAsset }: {
  title: string; asset: AssetDetail | null; thumbnailUrl: string | null; from: PanelSide; to: PanelSide; outcomes: string[];
  recent: ProfileReadResult<AssignmentEventsPage> | null; noAsset?: boolean;
}) {
  return (
    <aside
      aria-label={title}
      className="min-w-0 space-y-3"
    >
      <Card className="space-y-3 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <TransferIcon
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
          {title}
        </h2>
        {asset ? (
          <div className="flex min-w-0 items-center gap-3">
            <AssetThumbnail
              src={thumbnailUrl}
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
        <Side
          label="From (Current)"
          side={from}
        />
        <ArrowRightIcon
          aria-hidden="true"
          className="mx-3 size-4 rotate-90 text-muted-foreground"
        />
        <Side
          label="To (New)"
          side={to}
          live
        />
      </Card>
      <Card className="space-y-2 p-4">
        <h2 className="text-sm font-semibold text-foreground">What will happen?</h2>
        <ul className="space-y-2 text-xs text-foreground">
          {outcomes.map((line) => (
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
        {noAsset ? (
          <p className="text-xs text-muted-foreground">Select an asset to see its history.</p>
        ) : !recent ? (
          <Skeleton className="h-16 w-full" />
        ) : !recent.ok ? (
          <p className="text-xs text-muted-foreground">Couldn&apos;t load recent history.</p>
        ) : recent.data.data.length === 0 ? (
          <p className="text-xs text-muted-foreground">No earlier assignments</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.data.data.map((event) => {
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
