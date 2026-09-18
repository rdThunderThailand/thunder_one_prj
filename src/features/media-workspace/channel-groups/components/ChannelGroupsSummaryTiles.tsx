import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile } from "@/components/ui/StatTile";
import type { ChannelListItem } from "../../channels/types";
import { channelsInGroupsCount, summarizeGroups, ungroupedChannels } from "../channel-groups-logic";
import type { ChannelGroup } from "../types";

/** D1/D11's tiles: Total Groups / Active / Inactive / Channels in Groups / Ungrouped Channels. */
export function ChannelGroupsSummaryTiles({
  groups,
  channels,
}: {
  groups: ChannelGroup[] | null;
  channels: ChannelListItem[] | null;
}) {
  if (groups === null || channels === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
    );
  }

  const summary = summarizeGroups(groups);
  const inGroups = channelsInGroupsCount(channels);
  const ungrouped = ungroupedChannels(channels).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatTile label="Total Groups" value={String(summary.total)} color="indigo" />
      <StatTile label="Active" value={String(summary.active)} color="emerald" />
      <StatTile label="Inactive" value={String(summary.disabled)} color="amber" />
      <StatTile label="Channels in Groups" value={String(inGroups)} color="zinc" />
      <StatTile label="Ungrouped Channels" value={String(ungrouped)} color="zinc" />
    </div>
  );
}
