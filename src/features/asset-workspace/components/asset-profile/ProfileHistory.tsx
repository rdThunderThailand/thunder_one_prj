"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/lovable/button";
import { ChevronDownIcon } from "@/components/ui/icons";
import { activityLabel } from "../../domain/asset-profile";
import { attachmentLabel, historyGroupLabel } from "../../domain/asset-profile-display.mts";
import { useAssetActivity } from "../../hooks/use-asset-profile";
import { AssetThumbnail } from "../AssetThumbnail";
import { formatDateTime, ProfileSection, SectionMessage } from "./ProfileParts";
import { ProfileHistoryLoading } from "./AssetProfileLoading";

export function HistorySection({ context, assetId }: { context: string; assetId: string }) {
  const activity = useAssetActivity(context, assetId, true);
  const refreshed = useRef<string | null>(null);
  const { expiresAt, refresh } = activity;
  useEffect(() => {
    if (!expiresAt) return;
    const time = Date.parse(expiresAt);
    if (!Number.isFinite(time)) return;
    const timer = window.setTimeout(refresh, Math.max(time - Date.now() - 60_000, 5_000));
    return () => window.clearTimeout(timer);
  }, [expiresAt, refresh]);
  function refreshLinks() {
    if (!expiresAt || refreshed.current === expiresAt) return;
    refreshed.current = expiresAt;
    refresh();
  }
  return (
    <ProfileSection title="History" meta={activity.total || undefined} action={
      <Button variant="outline" size="sm" disabled={activity.pending} onClick={refresh}>Refresh history</Button>
    }>
      <ol className="divide-y divide-border">
        {activity.entries.map((group) => (
          <li key={group.id} className="py-3">
            <details className="group/history">
              <summary className="flex min-h-8 cursor-pointer flex-wrap items-start justify-between gap-2 rounded-control focus-visible:outline-2 focus-visible:outline-ring max-sm:min-h-10">
                <span className="min-w-0 space-y-1">
                  <span className="block text-xs font-semibold">{historyGroupLabel(group.kind, group.summary)}</span>
                  <span className="block text-xs text-muted-foreground">{group.actorName || "Unknown actor"} · {group.events.length} events</span>
                  {group.reason && <span className="block text-xs wrap-anywhere">Reason: {group.reason}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <time dateTime={group.at} className="text-xs tabular-nums text-muted-foreground">{formatDateTime(group.at)}</time>
                  <ChevronDownIcon aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-open/history:rotate-180 motion-reduce:transition-none" />
                </span>
              </summary>
              <ul aria-label="Events in this save" className="mt-3 space-y-3 border-t border-border pt-3 pl-3">
                {group.events.map((event) => (
                  <li key={event.id} className="space-y-1 text-xs">
                    <p className="font-medium">{event.file ? attachmentLabel(event.action, event.file.kind) : activityLabel(event.action, event.summary)}</p>
                    {event.reason && event.reason !== group.reason && <p className="wrap-anywhere text-muted-foreground">Reason: {event.reason}</p>}
                    {event.file && (
                      <div className="flex min-w-0 items-center gap-2">
                        {event.file.mimeType.startsWith("image/") && (
                          <AssetThumbnail src={event.file.thumbnailUrl ?? event.file.url} alt="" className="size-12" onFailed={refreshLinks} />
                        )}
                        {event.file.url ? (
                          <a href={event.file.url} target="_blank" rel="noopener noreferrer" className="min-w-0 rounded-control text-accent-foreground underline underline-offset-4 wrap-anywhere focus-visible:outline-2 focus-visible:outline-ring">{event.file.filename}</a>
                        ) : <span className="wrap-anywhere text-muted-foreground">{event.file.filename} · Link unavailable</span>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ol>
      {activity.pending && <ProfileHistoryLoading />}
      {activity.error && (
        <div className="space-y-2">
          <SectionMessage tone="error">{activity.error}</SectionMessage>
          <Button variant="outline" size="sm" onClick={activity.retry}>Retry history</Button>
        </div>
      )}
      {!activity.pending && !activity.error && !activity.entries.length && <SectionMessage>No history yet.</SectionMessage>}
      {activity.hasMore && !activity.pending && !activity.error && (
        <Button variant="outline" size="sm" onClick={activity.loadMore}>Load more</Button>
      )}
    </ProfileSection>
  );
}
