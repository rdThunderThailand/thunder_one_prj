"use client";

import { useMemo, useState } from "react";
import { SearchIcon, WarningTriangleIcon } from "@/components/ui/icons";
import type { ChannelListItem } from "../../channels/types";
import { channelCategories, type ChannelCategoryId, type ChannelItem } from "../mock-data";
import {
  computeCategoryCounts,
  filterBySearch,
  summarizeGeometryFit,
  toChannelItems,
} from "../channels-logic";
import { ChannelCard } from "./ChannelCard";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";

const VISIBLE_COUNT = 4;

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
  const [activeTab, setActiveTab] = useState<"all" | ChannelCategoryId>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const channels: ChannelItem[] = useMemo(() => toChannelItems(source), [source]);
  const filtered = useMemo(() => filterBySearch(channels, search), [channels, search]);
  const categoryCounts = useMemo(() => computeCategoryCounts(channels), [channels]);
  const geometryFit = useMemo(
    () => summarizeGeometryFit(source, selectedIds, aspectRatio),
    [source, selectedIds, aspectRatio],
  );

  const groups = channelCategories.filter((cat) => activeTab === "all" || activeTab === cat.id);

  return (
    <div className="flex flex-col gap-4">
      {loadingChannels && <p className="text-xs text-zinc-400">Loading channels...</p>}
      {!loadingChannels && channelsError && <p className="text-xs text-red-600">{channelsError}</p>}
      {!loadingChannels && !channelsError && channels.length === 0 && (
        <p className="text-xs text-zinc-400">No Channels available yet — create one first.</p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-zinc-100 pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-1 text-sm font-medium ${
            activeTab === "all" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          All {categoryCounts.all}
        </button>
        {channelCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`pb-1 text-sm font-medium ${
              activeTab === cat.id ? "border-b-2 border-indigo-600 text-indigo-600" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {cat.label} {categoryCounts[cat.id]}
          </button>
        ))}
      </div>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search channels..."
          className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>

      {(fitCheckFailed || geometryFit.unfitting.length > 0 || geometryFit.unprofiled.length > 0) && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
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

      {groups.map((cat) => {
        const items = filtered.filter((c) => c.category === cat.id);
        if (items.length === 0) return null;
        const isExpanded = expanded[cat.id] ?? false;
        const visible = isExpanded ? items : items.slice(0, VISIBLE_COUNT);

        return (
          <div key={cat.id}>
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">
              {cat.label} ({items.length})
            </h3>
            <div className="flex flex-col gap-2">
              {visible.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  selected={selectedIds.includes(channel.id)}
                  onToggle={() => toggleChannel(channel.id)}
                />
              ))}
            </div>
            {items.length > VISIBLE_COUNT && (
              <button
                onClick={() => setExpanded((prev) => ({ ...prev, [cat.id]: !isExpanded }))}
                className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        );
      })}

    </div>
  );
}

function FitWarning({ text, detail }: { text: string; detail?: string }) {
  return (
    <div className="flex items-start gap-2">
      <WarningTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
      <div>
        <p className="text-xs font-medium text-zinc-900">{text}</p>
        {detail && <p className="text-[11px] text-zinc-400">{detail}</p>}
      </div>
    </div>
  );
}
