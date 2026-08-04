"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { ChevronDownIcon, FilterIcon, GridIcon, ListIcon, SearchIcon, XIcon } from "@/components/ui/icons";
import type { Screen } from "../types";
import { channelCategories, type ChannelCategoryId, type ChannelItem } from "../mock-data";
import { ChannelCard, categoryBadgeColor, categoryIcon } from "./ChannelCard";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";

const VISIBLE_COUNT = 4;

/** Secondary line on a channel card. `connection_status` is a stored column that
 * does not track liveness — only `last_heartbeat_at` (and the `status_level`
 * derived from it: >5min = offline, >2min = warning) says whether a screen is up. */
function formatLastSeen(iso?: string | null): string {
  if (!iso) return "Never connected";
  const minutes = Math.floor((Date.now() - Date.parse(iso)) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) return "Last seen just now";
  if (minutes < 1) return "Last seen just now";
  if (minutes < 60) return `Last seen ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  return `Last seen ${Math.floor(hours / 24)}d ago`;
}

export interface ChannelsStepProps {
  screens?: Screen[];
  loadingScreens?: boolean;
  screensError?: string | null;
}

export function ChannelsStep({
  screens = [],
  loadingScreens = false,
  screensError = null,
}: ChannelsStepProps) {
  const selectedIds = usePublicationDraftStore((s) => s.channelIds);
  const toggleChannel = usePublicationDraftStore((s) => s.toggleChannelId);
  const setChannelIds = usePublicationDraftStore((s) => s.setChannelIds);
  const clearAll = () => setChannelIds([]);
  const [activeTab, setActiveTab] = useState<"all" | ChannelCategoryId>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<"grid" | "list">("grid");

  const channels: ChannelItem[] = useMemo(
    () =>
      screens.map((s) => ({
        id: s.id,
        name: s.name,
        // ponytail: Screen has no category field yet — every screen reads as
        // dooh until the backend adds one; upgrade when that lands.
        category: "dooh" as const,
        subLabel: formatLastSeen(s.last_heartbeat_at),
        status: s.status_level ?? "offline",
        resolution: undefined,
      })),
    [screens],
  );

  const filtered = useMemo(
    () => channels.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase())),
    [channels, search],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: channels.length };
    for (const cat of channelCategories) {
      counts[cat.id] = channels.filter((c) => c.category === cat.id).length;
    }
    return counts;
  }, [channels]);

  const groups = channelCategories.filter((cat) => activeTab === "all" || activeTab === cat.id);
  const selectedChannels = channels.filter((c) => selectedIds.includes(c.id));

  const statusCounts = useMemo(() => {
    const online = channels.filter((c) => c.status === "online").length;
    const warning = channels.filter((c) => c.status === "warning").length;
    const offline = channels.filter((c) => c.status === "offline").length;
    return { online, warning, offline, total: channels.length };
  }, [channels]);

  const statusPercent = (count: number) =>
    statusCounts.total === 0 ? 0 : Math.round((count / statusCounts.total) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Select Channels</h1>
        <p className="mt-0.5 text-sm text-zinc-500">เลือกช่องทางที่ต้องการเผยแพร่สื่อนี้</p>
        {loadingScreens && <p className="mt-1 text-xs text-zinc-400">Loading screens...</p>}
        {!loadingScreens && screensError && (
          <p className="mt-1 text-xs text-red-600">{screensError}</p>
        )}
        {!loadingScreens && !screensError && channels.length === 0 && (
          <p className="mt-1 text-xs text-zinc-400">No channels available yet.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <div className="flex flex-wrap items-center gap-5">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`pb-1 text-sm font-medium ${
                    activeTab === "all" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  All Channels {categoryCounts.all}
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
              <div className="flex shrink-0 rounded-lg border border-zinc-200 p-0.5">
                <button
                  onClick={() => setView("grid")}
                  className={`rounded-md p-1.5 ${view === "grid" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400"}`}
                  aria-label="Grid view"
                >
                  <GridIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`rounded-md p-1.5 ${view === "list" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400"}`}
                  aria-label="List view"
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[180px] flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search channels..."
                  className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              {/* ponytail: decorative only — Screen has no type/location field
                  and "status" already drives the summary card; wire these up
                  once the backend exposes type/location per screen. */}
              {["All Types", "All Status", "All Locations"].map((label) => (
                <div key={label} className="relative">
                  <select className="appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-8 text-sm text-zinc-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30">
                    <option>{label}</option>
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                </div>
              ))}
              <button className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
                <FilterIcon className="h-3.5 w-3.5" /> More Filters
              </button>
            </div>
          </Card>

          {groups.map((cat) => {
            const items = filtered.filter((c) => c.category === cat.id);
            if (items.length === 0) return null;
            const isExpanded = expanded[cat.id] ?? false;
            const visible = isExpanded ? items : items.slice(0, VISIBLE_COUNT);

            return (
              <Card key={cat.id} className="p-4">
                <h2 className="mb-3 text-sm font-semibold text-zinc-900">
                  {cat.label} ({items.length})
                </h2>
                <div className={`grid gap-3 ${view === "grid" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1"}`}>
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
                    className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    {isExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">Selected Channels ({selectedChannels.length})</h2>
              {selectedChannels.length > 0 && (
                <button onClick={clearAll} className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                  Clear all
                </button>
              )}
            </div>
            {selectedChannels.length === 0 ? (
              <p className="text-xs text-zinc-400">No channels selected yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {selectedChannels.map((channel) => (
                  <li key={channel.id} className="flex items-start gap-2.5">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${categoryBadgeColor[channel.category]}`}>
                      <span className="h-4 w-4">{categoryIcon[channel.category]}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">{channel.name}</p>
                      <p className="truncate text-xs text-zinc-400">
                        {channel.subLabel}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleChannel(channel.id)}
                      aria-label={`Remove ${channel.name}`}
                      className="shrink-0 text-zinc-400 hover:text-zinc-700"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Channel Status</h2>
            <div className="flex items-center gap-4">
              <DonutChart
                size={96}
                strokeWidth={14}
                segments={[
                  { label: "Online", value: statusCounts.online, color: "#10b981" },
                  { label: "Warning", value: statusCounts.warning, color: "#f59e0b" },
                  { label: "Offline", value: statusCounts.offline, color: "#ef4444" },
                ]}
              />
              <ul className="flex-1 space-y-1.5 text-xs">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
                  </span>
                  <span className="font-medium text-zinc-900">
                    {statusCounts.online} ({statusPercent(statusCounts.online)}%)
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Warning
                  </span>
                  <span className="font-medium text-zinc-900">
                    {statusCounts.warning} ({statusPercent(statusCounts.warning)}%)
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Offline
                  </span>
                  <span className="font-medium text-zinc-900">
                    {statusCounts.offline} ({statusPercent(statusCounts.offline)}%)
                  </span>
                </li>
                <li className="mt-1 flex items-center justify-between border-t border-zinc-100 pt-1.5">
                  <span className="text-zinc-500">Total</span>
                  <span className="font-semibold text-zinc-900">{statusCounts.total}</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
