"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { BoxIcon, EditIcon, MonitorIcon, PlayIcon, UsersIcon, XIcon } from "@/components/ui/icons";
import { channelTypeKey, channelTypeLabel } from "../channel-logic";
import { nowPlayingAllNames, nowPlayingRemaining, nowPlayingThumbnail, nowPlayingWindow } from "../now-playing";
import { fetchChannel } from "../services/channels-api";
import type { NowNextOccurrence } from "../../publications/now-next";
import { fetchPublication } from "../../publications/services/publications-api";
import type { ChannelLifecycle, ChannelListItem, ChannelStatusFilter } from "../types";
import { ChannelGroupsPickerModal } from "./ChannelGroupsPickerModal";
import { ChannelStructureTree } from "./ChannelStructureTree";

const STATUS_BADGE: Record<ChannelStatusFilter, { label: string; color: BadgeColor }> = {
  online: { label: "Online", color: "green" },
  warning: { label: "Warning", color: "yellow" },
  offline: { label: "Offline", color: "red" },
  no_player: { label: "No player", color: "zinc" },
};

const LIFECYCLE_BADGE: Record<ChannelLifecycle, { label: string; color: BadgeColor }> = {
  draft: { label: "Draft", color: "zinc" },
  active: { label: "Active", color: "green" },
  inactive: { label: "Inactive", color: "zinc" },
};

// Same stand-ins as ChannelTable: no TV/Kiosk pictograms exist, Monitor covers every
// screen-like Output Kind and Box covers Kiosk.
const TYPE_ICON: Record<ReturnType<typeof channelTypeKey>, typeof MonitorIcon> = {
  screen: MonitorIcon,
  tv: MonitorIcon,
  kiosk: BoxIcon,
  multi: MonitorIcon,
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "–";
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function ChannelDetailPanel({
  channel,
  occurrence,
  displayTimezone,
  showAddToGroup = false,
  onClose,
  onChanged,
}: {
  channel: ChannelListItem;
  occurrence: NowNextOccurrence | null | undefined;
  displayTimezone: string;
  showAddToGroup?: boolean;
  onClose: () => void;
  onChanged: (updated: ChannelListItem) => void;
}) {
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  // Keyed by (device, publication) so a stale result from a previous selection never renders
  // under a new one — the alternative, resetting state at the top of the effect, is a
  // synchronous setState-in-effect the lint config here forbids.
  const [viaGroupsResult, setViaGroupsResult] = useState<{ key: string; groups: string[] } | null>(null);
  const [managingGroups, setManagingGroups] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchChannel(channel.id)
      .then((detail) => alive && setCreatedAt(detail.created_at))
      .catch(() => alive && setCreatedAt(null));
    return () => {
      alive = false;
    };
  }, [channel.id]);

  const publicationId = occurrence?.publications[0]?.id;
  const deviceId = channel.player?.id;
  const viaGroupsKey = deviceId && publicationId ? `${deviceId}:${publicationId}` : null;

  useEffect(() => {
    let alive = true;
    if (!viaGroupsKey || !publicationId || !deviceId) return;
    fetchPublication(publicationId)
      .then((detail) => {
        if (!alive) return;
        const target = detail.targets?.find((t) => t.device_id === deviceId);
        if (target?.via_groups?.length) setViaGroupsResult({ key: viaGroupsKey, groups: target.via_groups });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [viaGroupsKey, publicationId, deviceId]);

  const viaGroups = viaGroupsResult?.key === viaGroupsKey ? viaGroupsResult.groups : null;

  const status = STATUS_BADGE[channel.health ?? "no_player"];
  const lifecycle = LIFECYCLE_BADGE[channel.lifecycle];
  const TypeIcon = TYPE_ICON[channelTypeKey(channel)];
  const groups = channel.groups ?? [];
  const cover = nowPlayingThumbnail(occurrence);
  const names = nowPlayingAllNames(occurrence);
  const window_ = nowPlayingWindow(occurrence, displayTimezone);
  const remaining = nowPlayingRemaining(occurrence);
  const screens = channel.display_config?.screens ?? [];
  const resolution =
    screens.length > 1
      ? `${channel.expected_resolution ?? "Not set"} (${screens.length} × ${screens[0]!.resolution})`
      : (channel.expected_resolution ?? "Not set");
  const panelId = `channel-detail-panel-${channel.id}`;
  const titleId = `channel-detail-title-${channel.id}`;

  return (
    <Card
      id={panelId}
      role="region"
      aria-labelledby={titleId}
      data-testid="channel-detail-panel"
      className="relative overflow-hidden p-5 xl:sticky xl:top-0 xl:self-start"
    >
      <div className="relative">
        {cover ? (
          <MediaThumb url={cover} alt="" className="h-32 w-full rounded-xl" />
        ) : (
          <div className="flex h-32 w-full items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <TypeIcon className="h-8 w-8" />
          </div>
        )}
        <button
          type="button"
          aria-label="Close channel detail"
          onClick={onClose}
          className="absolute right-2 top-2 rounded-lg bg-card/90 p-1.5 text-muted-foreground hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <XIcon />
        </button>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h2 id={titleId} className="min-w-0 truncate text-lg font-semibold text-foreground">
          {channel.name}
        </h2>
        <Badge color={status.color} variant="pill">{status.label}</Badge>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <Badge color={lifecycle.color} variant="pill">{lifecycle.label}</Badge>
      </div>
      {channel.description && (
        <p className="mt-2 text-sm leading-5 text-muted-foreground">{channel.description}</p>
      )}

      <div className="mt-4 flex items-center gap-2">
        {showAddToGroup ? (
          <button
            type="button"
            onClick={() => setManagingGroups(true)}
            className={buttonClasses("primary", "min-w-0 flex-1 gap-1 whitespace-nowrap px-1.5 text-[10px]")}
          >
            <UsersIcon />
            Add to Group
          </button>
        ) : (
          <button
            type="button"
            disabled
            title="Open Live View — not available yet"
            className={buttonClasses("secondary", "min-w-0 flex-1 gap-1 whitespace-nowrap px-1.5 text-[10px]")}
          >
            <PlayIcon />
            Open Live View
          </button>
        )}
        <Link
          href={`/media-workspace/channels/${channel.id}/edit`}
          className={buttonClasses("secondary", "min-w-0 flex-1 gap-1 whitespace-nowrap px-1.5 text-[10px]")}
        >
          <EditIcon />
          Edit Channel
        </Link>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</h3>
        <div className="mt-2 flex items-center gap-2">
          <Badge color={status.color}>{status.label}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Last updated {formatDateTime(channel.updated_at)}</p>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Now Playing</h3>
          <Link
            href={`/media-workspace/publications?q=${encodeURIComponent(channel.name)}`}
            className="text-xs font-medium text-primary hover:text-primary"
          >
            View Programs →
          </Link>
        </div>
        {names.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing scheduled now</p>
        ) : (
          <div className="mt-2 flex gap-3">
            <MediaThumb url={cover ?? undefined} alt="" className="h-14 w-20 rounded-lg" />
            <div className="min-w-0">
              {names.map((name) => (
                <p key={name} className="truncate text-sm font-medium text-foreground">
                  {name}
                </p>
              ))}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {window_}
                {remaining ? ` (${remaining})` : ""}
              </p>
              {viaGroups && <p className="mt-0.5 text-xs text-muted-foreground">via {viaGroups.join(", ")}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Channel Structure
        </h3>
        <ChannelStructureTree channel={channel} />
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Groups ({groups.length})
          </h3>
          <button
            type="button"
            onClick={() => setManagingGroups(true)}
            className="text-xs font-medium text-primary hover:text-primary"
          >
            Manage →
          </button>
        </div>
        {groups.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No Groups yet</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {groups.map((group) => (
              <Badge key={group.id} variant="pill" color="indigo">{group.name}</Badge>
            ))}
          </div>
        )}
      </div>

      {managingGroups && (
        <ChannelGroupsPickerModal
          channel={channel}
          onClose={() => setManagingGroups(false)}
          onSaved={(updated) => {
            setManagingGroups(false);
            onChanged(updated);
          }}
        />
      )}

      <div className="mt-4 border-t border-border pt-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Channel Information
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <DetailItem label="Type" value={channelTypeLabel(channel)} />
          <DetailItem label="Location" value={channel.location?.name ?? "Unassigned"} />
          <DetailItem label="Resolution" value={resolution} />
          <DetailItem label="Created" value={formatDateTime(createdAt)} />
          <DetailItem label="Last Updated" value={formatDateTime(channel.updated_at)} />
        </dl>
      </div>
    </Card>
  );
}
