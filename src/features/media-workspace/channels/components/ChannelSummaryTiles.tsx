import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile } from "@/components/ui/StatTile";
import type { summarizeChannels } from "../channel-logic";

type ChannelSummary = ReturnType<typeof summarizeChannels>;

function percentHint(count: number, total: number): string | undefined {
  return total === 0 ? undefined : `(${Math.round((count / total) * 100)}%)`;
}

/** D1's tiles: Total Channels / Online / Warning / Offline / Channel Groups. */
export function ChannelSummaryTiles({
  summary,
  groupCount,
  className = "",
}: {
  summary: ChannelSummary | null;
  /** `null` while `/media/channel-groups` is still loading; independent of `summary`'s load state. */
  groupCount: number | null;
  className?: string;
}) {
  if (summary === null) {
    return (
      <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-5 ${className}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-5 ${className}`}>
      <StatTile label="Total Channels" value={String(summary.total)} color="indigo" />
      <StatTile
        label="Online"
        value={String(summary.online)}
        hint={percentHint(summary.online, summary.total)}
        color="emerald"
      />
      <StatTile
        label="Warning"
        value={String(summary.warning)}
        hint={percentHint(summary.warning, summary.total)}
        color="amber"
      />
      <StatTile
        label="Offline"
        value={String(summary.offline)}
        hint={percentHint(summary.offline, summary.total)}
        color="red"
      />
      {groupCount === null ? (
        <div className="rounded-xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-12" />
        </div>
      ) : (
        <StatTile label="Channel Groups" value={String(groupCount)} color="zinc" />
      )}
    </div>
  );
}
