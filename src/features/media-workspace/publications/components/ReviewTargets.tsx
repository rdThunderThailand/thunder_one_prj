"use client";

import { useState } from "react";
import { MonitorIcon, UsersIcon } from "@/components/ui/icons";
import type { ChannelListItem } from "../../channels/types";
import { toChannelItems } from "../channels-logic";

type TargetTab = "screens" | "channels" | "groups";

export function ReviewTargets({
  channels,
  channelIds,
  groupIds,
  groupNamesById,
}: {
  channels: ChannelListItem[];
  channelIds: string[];
  groupIds: string[];
  groupNamesById: Record<string, string>;
}) {
  const [activeTab, setActiveTab] = useState<TargetTab>(groupIds.length > 0 ? "groups" : "channels");
  const itemsById = new Map(toChannelItems(channels).map((channel) => [channel.id, channel]));
  const selectedGroupIds = new Set(groupIds);
  const impactedChannels = channels
    .filter(
      (channel) =>
        channelIds.includes(channel.id) ||
        channel.groups.some((group) => selectedGroupIds.has(group.id)),
    )
    .map((channel) => ({ source: channel, item: itemsById.get(channel.id) }))
    .filter((channel) => channel.item !== undefined);
  const selectedGroups = groupIds.map((id) => ({
    id,
    name: groupNamesById[id] ?? channels.flatMap((channel) => channel.groups).find((group) => group.id === id)?.name ?? id,
    members: channels.filter((channel) => channel.groups.some((group) => group.id === id)).length,
  }));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[0.75fr_1fr_1.2fr] gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Review target type">
        <TargetTabButton label="Screens" active={activeTab === "screens"} disabled onClick={() => undefined} />
        <TargetTabButton label={`Channels (${impactedChannels.length})`} active={activeTab === "channels"} onClick={() => setActiveTab("channels")} />
        <TargetTabButton label={`Groups (${selectedGroups.length})`} active={activeTab === "groups"} onClick={() => setActiveTab("groups")} />
      </div>

      {activeTab === "channels" && (
        <div className="space-y-1.5">
          {impactedChannels.map(({ source, item }) => {
            const inheritedGroups = source.groups.filter((group) => selectedGroupIds.has(group.id));
            const isDirect = channelIds.includes(source.id);
            return (
              <div key={source.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted px-2.5 py-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
                  <MonitorIcon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground" title={item?.name}>{item?.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {isDirect ? "Direct" : inheritedGroups.map((group) => group.name).join(", ")} · {item?.subLabel}
                  </p>
                </div>
                <span className={`h-2 w-2 shrink-0 rounded-full ${item?.status === "online" ? "bg-success" : item?.status === "warning" ? "bg-warning" : "bg-danger"}`} title={item?.status} />
              </div>
            );
          })}
          {impactedChannels.length === 0 && <EmptyTargets label="No impacted channels" />}
        </div>
      )}

      {activeTab === "groups" && (
        <div className="space-y-1.5">
          {selectedGroups.map((group) => (
            <div key={group.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted px-2.5 py-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-violet-50 text-violet-600">
                <UsersIcon className="h-3.5 w-3.5" />
              </span>
              <p className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground" title={group.name}>{group.name}</p>
              <span className="shrink-0 text-[10px] text-muted-foreground">{group.members} channels</span>
            </div>
          ))}
          {selectedGroups.length === 0 && <EmptyTargets label="No channel groups selected" />}
        </div>
      )}
    </div>
  );
}

function TargetTabButton({ label, active, disabled = false, onClick }: { label: string; active: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      title={disabled ? "ยังไม่เปิดใช้งาน" : undefined}
      onClick={onClick}
      className={`whitespace-nowrap rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors ${active ? "bg-card text-foreground shadow-sm" : disabled ? "cursor-not-allowed text-muted-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      {label}
    </button>
  );
}

function EmptyTargets({ label }: { label: string }) {
  return <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">{label}</p>;
}
