import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile } from "@/components/ui/StatTile";
import type { summarizeChannels } from "../channel-logic";

type ChannelSummary = ReturnType<typeof summarizeChannels>;

export function ChannelSummaryTiles({ summary }: { summary: ChannelSummary | null }) {
  if (summary === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <StatTile label="Total Channels" value={String(summary.lifecycle.total)} color="indigo" />
      <StatTile label="Active" value={String(summary.lifecycle.active)} color="emerald" />
      <StatTile label="Inactive" value={String(summary.lifecycle.inactive)} color="zinc" />
      <StatTile label="Draft" value={String(summary.lifecycle.draft)} color="amber" />
      <StatTile
        label="Devices Online"
        value={`${summary.devices.online}/${summary.devices.total}`}
        color={summary.devices.online === summary.devices.total ? "emerald" : "red"}
      />
      <StatTile label="Unassigned" value={String(summary.unassigned)} color="zinc" />
    </div>
  );
}
