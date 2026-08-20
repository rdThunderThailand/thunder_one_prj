import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { deriveChannelHealth, formatChannelLastSeen } from "../channel-logic";
import type {
  ChannelCategory,
  ChannelDeviceCandidate,
  ChannelLifecycle,
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-800">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">{value}</dd>
    </div>
  );
}

function latestHeartbeat(devices: ChannelDeviceCandidate[]): string | null {
  return devices.reduce<string | null>((latest, device) => {
    if (!device.last_heartbeat_at) return latest;
    if (!latest || Date.parse(device.last_heartbeat_at) > Date.parse(latest)) {
      return device.last_heartbeat_at;
    }
    return latest;
  }, null);
}

export function ChannelEditorSummary({
  lifecycle,
  category,
  typeName,
  locationName,
  orientation,
  resolution,
  playlistName,
  selectedDevices,
  showOperationalStatus,
}: {
  lifecycle: ChannelLifecycle;
  category: ChannelCategory;
  typeName: string;
  locationName: string;
  orientation: string | null;
  resolution: string | null;
  playlistName: string;
  selectedDevices: ChannelDeviceCandidate[];
  showOperationalStatus: boolean;
}) {
  const lifecycleBadge = lifecycleBadges[lifecycle];
  const health = deriveChannelHealth(selectedDevices.map((device) => device.health));
  const expectedOutput = [orientation, resolution].filter(Boolean).join(" · ") || "Not set";

  return (
    <Card className="relative overflow-hidden p-5 xl:sticky xl:top-0 xl:self-start">
      <div className="absolute inset-x-0 top-0 h-1 bg-indigo-600" aria-hidden="true" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
        Review before save
      </p>
      <h2 className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
        Channel Summary
      </h2>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3.5 py-3 dark:bg-zinc-950/60">
        <Badge color={lifecycleBadge.color} variant="pill">
          {lifecycleBadge.label}
        </Badge>
        <span className="text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
          {selectedDevices.length} device{selectedDevices.length === 1 ? "" : "s"}
        </span>
      </div>

      <dl className="mt-2">
        <SummaryItem label="Category" value={categoryLabels[category]} />
        <SummaryItem label="Type" value={typeName || "Not selected"} />
        <SummaryItem label="Location" value={locationName || "No location"} />
        <SummaryItem label="Expected output" value={expectedOutput} />
        <SummaryItem label="Default Playlist" value={playlistName || "No default playlist"} />
        {showOperationalStatus && (
          <>
            <SummaryItem
              label="Health"
              value={health ? health[0].toUpperCase() + health.slice(1) : "Unassigned"}
            />
            <SummaryItem
              label="Last seen"
              value={formatChannelLastSeen(latestHeartbeat(selectedDevices))}
            />
          </>
        )}
      </dl>
    </Card>
  );
}
