"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/lovable/dialog";
import { Input } from "@/components/ui/lovable/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
import { fetchChannelGroups } from "../../../channel-groups/services/channel-groups-api";
import type { ChannelGroup } from "../../../channel-groups/types";
import { channelStatus, channelTypeKey, channelTypeLabel, filterChannels } from "../../../channels/channel-logic";
import type { ChannelListItem, ChannelStatusFilter, ChannelTypeFilter } from "../../../channels/types";
import {
  facetCounts,
  reachedChannels,
  selectionFromTargets,
  targetableChannels,
  targetsFromSelection,
  targetSummary,
  toggleId,
  type TargetSelection,
} from "../../target-picker";
import type { PublicationTarget } from "../../types";
import { TargetFacet } from "./TargetFacet";
import { SelectedTargetPanel } from "./SelectedTargetPanel";

const STATUS_LABEL: Record<ChannelStatusFilter, string> = {
  online: "Online",
  warning: "Warning",
  offline: "Offline",
  no_player: "No player",
};
const STATUS_DOT: Record<ChannelStatusFilter, string> = {
  online: "bg-success",
  warning: "bg-warning",
  offline: "bg-danger",
  no_player: "bg-border",
};

type Filters = { search: string; type: ChannelTypeFilter | "all"; status: ChannelStatusFilter | "all"; locationId: string };
const NO_FILTERS: Filters = { search: "", type: "all", status: "all", locationId: "all" };

/** Frame 07 "Change Target": stages Channel / Group picks locally; Apply replaces `targets` in one patch. */
export function ChangeTargetModal({
  targets,
  channels: allChannels,
  onClose,
  onApply,
}: {
  targets: PublicationTarget[];
  channels: ChannelListItem[];
  onClose: () => void;
  onApply: (targets: PublicationTarget[]) => void;
}) {
  const channels = useMemo(() => targetableChannels(allChannels), [allChannels]);
  const [selection, setSelection] = useState<TargetSelection>(() => selectionFromTargets(targets));
  const [filters, setFilters] = useState(NO_FILTERS);
  const [groups, setGroups] = useState<ChannelGroup[] | null>(null);
  const [groupsError, setGroupsError] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");

  useEffect(() => {
    let alive = true;
    fetchChannelGroups()
      .then((data) => alive && setGroups(data))
      .catch(() => alive && setGroupsError(true));
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(
    () =>
      filterChannels(channels, { search: filters.search, type: filters.type, status: filters.status, lifecycle: "all" }).filter(
        (channel) => filters.locationId === "all" || channel.location?.id === filters.locationId,
      ),
    [channels, filters],
  );
  const typeOptions = useMemo(() => {
    const counts = facetCounts(channels.map(channelTypeKey));
    return [...counts].map(([key, count]) => ({ key, count, label: channelTypeLabel(channels.find((c) => channelTypeKey(c) === key)!) }));
  }, [channels]);
  const locationOptions = useMemo(() => {
    const located = channels.flatMap((c) => (c.location ? [c.location] : []));
    const counts = facetCounts(located.map((l) => l.id));
    return [...counts].map(([key, count]) => ({ key, count, label: located.find((l) => l.id === key)!.name }));
  }, [channels]);
  const statusOptions = useMemo(
    () => [...facetCounts(channels.map(channelStatus))].map(([key, count]) => ({ key, count, label: STATUS_LABEL[key] })),
    [channels],
  );

  const activeGroups = useMemo(
    () => (groups ?? []).filter((g) => g.status === "active" && g.name.toLowerCase().includes(groupSearch.trim().toLowerCase())),
    [groups, groupSearch],
  );
  const summary = targetSummary(channels, selection);
  const reachedCount = reachedChannels(channels, selection).length;
  const applied = targetsFromSelection(targets, selection, channels, groups ?? []);
  // Selected list shows what Apply will store, so a Group whose name is gone still reads.
  const selectedRows = applied.filter((t) => t.target_type !== "device");
  const set = (next: Partial<Filters>) => setFilters((current) => ({ ...current, ...next }));

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-6xl gap-0 p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Change Target</DialogTitle>
          <DialogDescription>เลือก Channel หรือ Channel Group ที่ต้องการแสดง Program นี้</DialogDescription>
        </DialogHeader>
        <div className="grid min-h-[30rem] grid-cols-[minmax(0,1fr)_20rem]">
          <Tabs
            defaultValue="channels"
            className="flex min-w-0 flex-col border-r border-border p-4"
          >
            <TabsList className="self-start">
              <TabsTrigger value="channels">All Channels</TabsTrigger>
              <TabsTrigger value="groups">Channel Groups</TabsTrigger>
              <TabsTrigger
                value="locations"
                disabled
                title="เร็วๆ นี้"
              >
                Locations
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="channels"
              className="mt-3 grid min-h-0 flex-1 grid-cols-[11rem_minmax(0,1fr)] gap-4"
            >
              <aside className="max-h-[26rem] overflow-y-auto">
                <TargetFacet
                  label="Type"
                  allLabel="All Types"
                  value={filters.type}
                  options={typeOptions}
                  onChange={(type) => set({ type })}
                />
                <TargetFacet
                  label="Location"
                  allLabel="All Locations"
                  value={filters.locationId}
                  options={locationOptions}
                  onChange={(locationId) => set({ locationId })}
                />
                <TargetFacet
                  label="Status"
                  allLabel="All Status"
                  value={filters.status}
                  options={statusOptions}
                  onChange={(status) => set({ status })}
                />
              </aside>
              <div className="flex min-w-0 flex-col gap-2">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={filters.search}
                    onChange={(event) => set({ search: event.target.value })}
                    placeholder="Search channels, locations…"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Channels ({visible.length})</p>
                <ul className="flex max-h-[22rem] flex-col gap-1.5 overflow-y-auto">
                  {visible.map((channel) => {
                    const status = channelStatus(channel);
                    return (
                      <li key={channel.id}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 hover:bg-muted">
                          <Checkbox
                            checked={selection.channelIds.includes(channel.id)}
                            onCheckedChange={() => setSelection((s) => ({ ...s, channelIds: toggleId(s.channelIds, channel.id) }))}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-foreground">{channel.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {channel.location?.name ?? "No location"} · {channelTypeLabel(channel)}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
                            {STATUS_LABEL[status]}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                  {visible.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">No channels match these filters.</li>}
                </ul>
              </div>
            </TabsContent>
            <TabsContent
              value="groups"
              className="mt-3 flex flex-col gap-2"
            >
              <Input
                value={groupSearch}
                onChange={(event) => setGroupSearch(event.target.value)}
                placeholder="Search channel groups…"
              />
              {groups === null && <p className="text-xs text-muted-foreground">{groupsError ? "Could not load Channel Groups." : "Loading channel groups…"}</p>}
              <ul className="flex max-h-[22rem] flex-col gap-1.5 overflow-y-auto">
                {activeGroups.map((group) => (
                  <li key={group.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 hover:bg-muted">
                      <Checkbox
                        checked={selection.groupIds.includes(group.id)}
                        onCheckedChange={() => setSelection((s) => ({ ...s, groupIds: toggleId(s.groupIds, group.id) }))}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">{group.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {group.member_count} channels · {group.playback_mode === "synchronized" ? "Synchronized" : "Independent"}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
                {groups !== null && activeGroups.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">No channel groups found.</li>}
              </ul>
            </TabsContent>
          </Tabs>
          <SelectedTargetPanel
            rows={selectedRows}
            summary={summary}
            onClear={() => setSelection({ channelIds: [], groupIds: [] })}
            onRemove={(target) => {
              const id = (target.channel_id ?? target.group_id)!;
              setSelection((s) =>
                target.target_type === "group"
                  ? { ...s, groupIds: toggleId(s.groupIds, id) }
                  : { ...s, channelIds: toggleId(s.channelIds, id) },
              );
            }}
          />
        </div>
        <DialogFooter className="border-t border-border px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            disabled={selectedRows.length === 0}
            onClick={() => onApply(applied)}
          >
            Apply ({reachedCount} {reachedCount === 1 ? "channel" : "channels"})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
