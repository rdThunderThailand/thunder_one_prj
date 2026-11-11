"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { LocationIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { locationHistoryCursor } from "../../domain/assignment-location-history";
import { useProfileRead } from "../../hooks/use-asset-profile";
import {
  getAssetLocationHistory, getLocationHistoryLocations, type LocationHistoryEvent,
} from "../../services/asset-assignments-location-history";
import { ErrorState } from "../states/ErrorState";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { ProfileAssignmentEventsTable } from "./ProfileAssignmentEventsTable";
import { ProfileAssignmentPager } from "./ProfileAssignmentPager";
import { ProfileLocationHistoryLoading } from "./ProfileLocationHistoryLoading";
import { ProfileLocationHistoryPanel } from "./ProfileLocationHistoryPanel";

const PAGE_SIZE = 20;
type Selection = { page: number; index: number; id?: string; previousTotal?: number };

export function ProfileLocationHistory({ context, assetId, enabled, layout }: {
  context: string; assetId: string; enabled: boolean;
  layout: (content: ReactNode, panel: ReactNode) => ReactNode;
}) {
  const [selection, setSelection] = useState<Selection>({ page: 1, index: 0 });
  const [opened, setOpened] = useState(false);
  if (enabled && !opened) setOpened(true);
  const history = useProfileRead(`${context}:${assetId}:location-history:${selection.page}`,
    (signal) => getAssetLocationHistory(context, assetId, { page: selection.page, pageSize: PAGE_SIZE }, signal), enabled);
  const paths = useProfileRead(`${context}:history-location-paths`, (signal) => getLocationHistoryLocations(context, signal), enabled || opened);
  const locations = useMemo(() => new Map(paths.result?.ok ? paths.result.data.map((location) => [location.id, location]) : []),
    [paths.result]);

  if (!enabled) return layout(null, null);
  const page = history.result?.ok ? history.result.data : null;
  const selectedIndex = selection.id && page ? page.data.findIndex((row) => row.id === selection.id) : selection.index;
  const index = page?.data[selectedIndex] ? selectedIndex : 0;
  const event = page?.data[index] ?? null;
  if (event && (event.id !== selection.id || index !== selection.index)) {
    setSelection({ page: selection.page, index, id: event.id });
  }
  const position = (selection.page - 1) * PAGE_SIZE + (event ? index : selection.index) + 1;
  const total = page?.total ?? selection.previousTotal ?? 0;
  function goToPage(next: number) {
    if (next !== selection.page) setSelection({ page: next, index: 0, previousTotal: total });
  }
  function select(row: LocationHistoryEvent) {
    if (!page) return;
    const rowIndex = page.data.findIndex((candidate) => candidate.id === row.id);
    if (rowIndex >= 0) setSelection({ page: page.page, index: rowIndex, id: row.id });
  }
  function step(direction: -1 | 1) {
    const cursor = locationHistoryCursor(position + direction, PAGE_SIZE, total);
    if (!cursor) return;
    const id = cursor.page === page?.page ? page.data[cursor.index]?.id : undefined;
    setSelection({ ...cursor, id, previousTotal: total });
  }

  const pending = history.pending && !page;
  let results;
  if (pending || !history.result) {
    results = <ProfileLocationHistoryLoading />;
  } else if (!history.result.ok) {
    const code = history.result.code;
    results = (
      <div className="p-4">
        {code === "NOT_FOUND" ? (
          <NotFoundState title="Asset not found" body="This asset doesn't exist in your organization, or it is no longer available." />
        ) : code === "PERMISSION_DENIED" ? (
          <AccessDeniedState title="You don't have access" body="You don't have permission to view this asset's location history." />
        ) : code === "UNAUTHENTICATED" ? (
          <EmptyState title="Sign in required" body="Your session has expired. Sign in again to view this asset." />
        ) : (
          <ErrorState title="Couldn't load location history" body="Check your connection and retry." onRetry={history.reload} />
        )}
      </div>
    );
  } else if (page && !page.data.length) {
    results = (
      <div className="p-4">
        {page.total > 0 || page.page > 1 ? (
          <EmptyState title="No location history on this page"
            action={<Button variant="outline" onClick={() => goToPage(1)}>Go to first page</Button>} />
        ) : (
          <EmptyState title="No location history" body="Location changes will appear here." />
        )}
      </div>
    );
  } else if (page) {
    results = (
      <>
        <ProfileAssignmentEventsTable variant="location" rows={page.data} locations={locations}
          page={page.page} pageSize={page.pageSize} selectedKey={event?.id} onSelect={select} />
        <ProfileAssignmentPager page={page.page} pageSize={page.pageSize} total={page.total} totalPages={page.totalPages}
          itemLabel="records" onPageChange={goToPage} />
      </>
    );
  }

  const content = (
    <Card className="min-w-0 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none" aria-busy={history.pending}>
      <div className="flex items-start gap-2 px-4 py-3">
        <LocationIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <div>
          <h2 className="text-sm font-semibold">Location History</h2>
          <p className="text-xs text-muted-foreground">Track all location changes for this asset.</p>
        </div>
      </div>
      {page?.data.length && paths.result && !paths.result.ok ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 text-xs">
          <p>Couldn&apos;t load the location path</p>
          <Button size="sm" variant="outline" disabled={paths.pending} onClick={paths.reload}>Retry</Button>
        </div>
      ) : null}
      {results}
    </Card>
  );
  return layout(content, event || pending ? (
    <ProfileLocationHistoryPanel event={event} position={position} total={total} locations={locations} pending={history.pending} onStep={step} />
  ) : null);
}
