"use client";

import { useMemo, useState } from "react";
import { SearchIcon, WarningTriangleIcon } from "@/components/ui/icons";
import type { ChannelListItem } from "../../channels/types";
import type { ChannelItem } from "../mock-data";
import {
  filterBySearch,
  selectedGroupItems,
  summarizeGeometryFit,
  toChannelItems,
} from "../channels-logic";
import { ChannelCard } from "./ChannelCard";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";

export interface ChannelsStepProps {
  channels?: ChannelListItem[];
  loadingChannels?: boolean;
  channelsError?: string | null;
  aspectRatio?: string | null;
  fitCheckFailed?: boolean;
}

/** Frame 3 "1. Where to Play" — Channels tab body. Renders as one column inside
 *  WhereToPlayPanel; the column header replaces its former page heading. */
export function ChannelsStep({
  channels: source = [],
  loadingChannels = false,
  channelsError = null,
  aspectRatio = null,
  fitCheckFailed = false,
}: ChannelsStepProps) {
  const selectedIds = usePublicationDraftStore((s) => s.channelIds);
  const toggleChannel = usePublicationDraftStore((s) => s.toggleChannelId);
  const groupIds = usePublicationDraftStore((s) => s.groupIds);
  const groupNamesById = usePublicationDraftStore((s) => s.groupNamesById);
  const setGroupIds = usePublicationDraftStore((s) => s.setGroupIds);
  const [search, setSearch] = useState("");

  const channels: ChannelItem[] = useMemo(() => toChannelItems(source), [source]);
  const filtered = useMemo(() => filterBySearch(channels, search), [channels, search]);
  const geometryFit = useMemo(
    () => summarizeGeometryFit(source, selectedIds, aspectRatio),
    [source, selectedIds, aspectRatio],
  );
  const selectedGroups = useMemo(
    () => selectedGroupItems(source, groupIds, groupNamesById),
    [source, groupIds, groupNamesById],
  );

  return (
    <div className="flex flex-col gap-3">
      {selectedGroups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedGroups.map((group) => (
            <div
              key={group.id}
              className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary-soft px-3 py-1.5 text-sm text-primary"
            >
              <span>{group.name} · {group.channelCount} channels</span>
              <button
                type="button"
                aria-label={`Remove ${group.name}`}
                onClick={() => setGroupIds(groupIds.filter((id) => id !== group.id))}
                className="text-primary hover:text-primary"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {loadingChannels && <p className="text-xs text-muted-foreground">Loading channels...</p>}
      {!loadingChannels && channelsError && <p className="text-xs text-danger">{channelsError}</p>}
      {!loadingChannels && !channelsError && channels.length === 0 && (
        <p className="text-xs text-muted-foreground">No Channels available yet — create one first.</p>
      )}

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search channels..."
          className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {(fitCheckFailed || geometryFit.unfitting.length > 0 || geometryFit.unprofiled.length > 0) && (
        <div className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning-soft p-3">
          {fitCheckFailed && (
            <FitWarning text="Could not check whether these screens fit the Layout." />
          )}
          {geometryFit.unfitting.length > 0 && (
            <FitWarning
              text={`Layout shape mismatch (${geometryFit.unfitting.length})`}
              detail={`These screens do not match this Layout's shape and will show it distorted or rotated: ${geometryFit.unfitting.join(", ")}. You can still publish.`}
            />
          )}
          {geometryFit.unprofiled.length > 0 && (
            <FitWarning
              text={`Screen size unknown (${geometryFit.unprofiled.length})`}
              detail={`These screens have not reported their size yet, so their fit is unknown: ${geometryFit.unprofiled.join(", ")}. You can still publish.`}
            />
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {filtered.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            selected={selectedIds.includes(channel.id)}
            onToggle={() => toggleChannel(channel.id)}
          />
        ))}
      </div>

    </div>
  );
}

function FitWarning({ text, detail }: { text: string; detail?: string }) {
  return (
    <div className="flex items-start gap-2">
      <WarningTriangleIcon className="h-4 w-4 shrink-0 text-warning" />
      <div>
        <p className="text-xs font-medium text-foreground">{text}</p>
        {detail && <p className="text-[11px] text-muted-foreground">{detail}</p>}
      </div>
    </div>
  );
}
