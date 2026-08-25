"use client";

import Link from "next/link";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { XIcon } from "@/components/ui/icons";
import { countOnlineDevices, formatChannelLastSeen } from "../channel-logic";
import type {
  ChannelCategory,
  ChannelLifecycle,
  ChannelListItem,
} from "../types";

const categoryLabels: Record<ChannelCategory, string> = {
  dooh: "DOOH",
  in_store: "In-store",
  online: "Online",
  social: "Social",
};

const lifecycleBadges: Record<ChannelLifecycle, { label: string; color: BadgeColor }> = {
  draft: { label: "Draft", color: "zinc" },
  active: { label: "Active", color: "green" },
  inactive: { label: "Inactive", color: "zinc" },
};

function latestHeartbeat(channel: ChannelListItem): string | null {
  return channel.devices.reduce<string | null>((latest, device) => {
    if (!device.last_heartbeat_at) return latest;
    if (!latest || Date.parse(device.last_heartbeat_at) > Date.parse(latest)) {
      return device.last_heartbeat_at;
    }
    return latest;
  }, null);
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">{value}</dd>
    </div>
  );
}

export function ChannelDetailPanel({
  channel,
  onClose,
}: {
  channel: ChannelListItem;
  onClose: () => void;
}) {
  const lifecycle = lifecycleBadges[channel.lifecycle];
  const online = countOnlineDevices(channel.devices);
  const heartbeat = latestHeartbeat(channel);
  const expectedOutput =
    [channel.expected_orientation, channel.expected_resolution].filter(Boolean).join(" · ") ||
    "Not set";
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
      <div className="absolute inset-x-0 top-0 h-1 bg-indigo-600" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
            Channel detail
          </p>
          <h2 id={titleId} className="mt-1 truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            {channel.name}
          </h2>
          {channel.description && (
            <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-400">
              {channel.description}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Close channel detail"
          onClick={onClose}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <XIcon />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-zinc-100 py-3 dark:border-zinc-800">
        <Badge color={lifecycle.color} variant="pill">
          {lifecycle.label}
        </Badge>
        <Badge color={channel.devices.length === 0 ? "zinc" : online === channel.devices.length ? "green" : "red"}>
          {channel.devices.length === 0 ? "Unassigned" : `${online}/${channel.devices.length} online`}
        </Badge>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 py-5">
        <DetailItem label="Category" value={categoryLabels[channel.category]} />
        <DetailItem label="Type" value={channel.channel_type?.name ?? "Not set"} />
        <DetailItem label="Location" value={channel.location?.name ?? "Unassigned"} />
        <DetailItem label="Expected output" value={expectedOutput} />
        <DetailItem label="Assigned devices" value={String(channel.devices.length)} />
        <DetailItem label="Last seen" value={formatChannelLastSeen(heartbeat)} />
      </dl>

      <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Physical Devices
        </h3>
        {channel.devices.length === 0 ? (
          <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-4 text-center text-sm text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            No devices assigned
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {channel.devices.map((device) => (
              <li
                key={device.id}
                className="rounded-lg border border-zinc-100 bg-zinc-50/70 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {device.name}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-400">
                      {device.code}
                    </p>
                  </div>
                  <Badge
                    color={
                      device.health === "online"
                        ? "green"
                        : device.health === "warning"
                          ? "yellow"
                          : "red"
                    }
                  >
                    {device.health[0].toUpperCase() + device.health.slice(1)}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Heartbeat · {formatChannelLastSeen(device.last_heartbeat_at)}
                </p>
                {channel.sync_enabled && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {device.sync_phase_error_ms === null
                      ? "Sync · no report yet"
                      : `Sync · ${device.sync_phase_error_ms > 0 ? "+" : ""}${device.sync_phase_error_ms} ms · loop ${device.sync_loop_duration_seconds ?? "?"}s`}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        href={`/media-workspace/channels/${channel.id}/edit`}
        className={buttonClasses("primary", "mt-5 w-full")}
      >
        Edit Channel
      </Link>
    </Card>
  );
}
