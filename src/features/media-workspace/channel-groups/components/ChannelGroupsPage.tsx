"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { NoAccess } from "@/components/ui/NoAccess";
import { Tabs } from "@/components/ui/Tabs";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchChannels } from "../../channels/services/channels-api";
import type { ChannelListItem } from "../../channels/types";
import { ungroupedChannels } from "../channel-groups-logic";
import { fetchChannelGroups } from "../services/channel-groups-api";
import type { ChannelGroup } from "../types";
import { ChannelGroupInspector } from "./ChannelGroupInspector";
import { ChannelGroupsSummaryTiles } from "./ChannelGroupsSummaryTiles";
import { ChannelGroupsTable } from "./ChannelGroupsTable";
import { CreateEditGroupModal } from "./CreateEditGroupModal";
import { UngroupedChannelsTable } from "./UngroupedChannelsTable";
import { ChannelDetailPanel } from "../../channels/components/ChannelDetailPanel";

export function ChannelGroupsPage() {
  const [groups, setGroups] = useState<ChannelGroup[] | null>(null);
  const [channels, setChannels] = useState<ChannelListItem[] | null>(null);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUngroupedId, setSelectedUngroupedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("groups");
  const [ungroupedSelection, setUngroupedSelection] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    return Promise.all([fetchChannelGroups(), fetchChannels()]).then(([g, c]) => {
      setGroups(g);
      setChannels(c);
      setError(null);
    });
  }, []);

  useEffect(() => {
    load().catch((caught) => setError(classifyApiError(caught, "Could not load Channel Groups. Try again.")));
  }, [load]);

  const selected = groups?.find((g) => g.id === selectedId) ?? null;
  const ungrouped = useMemo(() => (channels ? ungroupedChannels(channels) : []), [channels]);
  const selectedUngrouped = ungrouped.find((channel) => channel.id === selectedUngroupedId) ?? null;
  const hasSidebar = selected !== null || selectedUngrouped !== null;

  const handleGroupChanged = (updated: ChannelGroup) => {
    setGroups((current) => current?.map((g) => (g.id === updated.id ? updated : g)) ?? current);
    // Membership changes move channels between the two tabs — re-derive from the server
    // rather than hand-patching each channel's `groups[]` client-side.
    fetchChannels().then(setChannels).catch(() => {});
  };

  const handleGroupDeleted = () => {
    setSelectedId(null);
    setGroups((current) => current?.filter((g) => g.id !== selectedId) ?? current);
    fetchChannels().then(setChannels).catch(() => {});
  };

  const handleChannelChanged = (updated: ChannelListItem) => {
    setChannels((current) => current?.map((channel) => (channel.id === updated.id ? updated : channel)) ?? current);
  };

  if (error?.kind === "forbidden") {
    return <NoAccess message={error.message} />;
  }

  return (
    <div
      className={
        hasSidebar
          ? "grid h-full grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_420px]"
          : "flex h-full flex-col gap-5"
      }
    >
      <div className={hasSidebar ? "xl:col-span-2" : undefined}>
        <PageHeader title="Channel Groups" subtitle="Organize channels into groups for easier management and synchronized content." />
      </div>
      <ChannelGroupsSummaryTiles groups={groups} channels={channels} />

      {error && groups === null ? (
        <Card className="p-6 text-center text-sm text-danger">{error.message}</Card>
      ) : groups === null || channels === null ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">Loading…</Card>
      ) : (
        <div className={hasSidebar ? "min-h-0 min-w-0 xl:col-start-1 xl:row-start-3" : "flex min-h-0 min-w-0 flex-1"}>
          <Card className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key);
                if (key !== "groups") setSelectedId(null);
                if (key !== "ungrouped") setSelectedUngroupedId(null);
              }}
              items={[
                {
                  key: "groups",
                  label: `Channel Groups (${groups.length})`,
                  content: <ChannelGroupsTable groups={groups} selectedId={selectedId} onSelect={(g) => {
                    setSelectedUngroupedId(null);
                    setSelectedId(g.id);
                  }} />,
                },
                {
                  key: "ungrouped",
                  label: `Ungrouped Channels (${ungrouped.length})`,
                  content: (
                    <UngroupedChannelsTable
                      channels={ungrouped}
                      groups={groups}
                      selected={ungroupedSelection}
                      selectedChannelId={selectedUngroupedId}
                      onSelectionChange={setUngroupedSelection}
                      onSelect={(channel) => {
                        setSelectedId(null);
                        setSelectedUngroupedId(channel.id);
                      }}
                      onCreateGroup={() => setCreating(true)}
                      onGroupChanged={handleGroupChanged}
                    />
                  ),
                },
              ]}
            />
          </Card>

        </div>
      )}

      {selected && channels && (
        <div className="min-h-0 xl:col-start-2 xl:row-start-2 xl:row-span-2">
          <ChannelGroupInspector
            key={selected.id}
            group={selected}
            channels={channels}
            onClose={() => setSelectedId(null)}
            onChanged={handleGroupChanged}
            onDeleted={handleGroupDeleted}
          />
        </div>
      )}

      {selectedUngrouped && (
        <div className="min-h-0 xl:col-start-2 xl:row-start-2 xl:row-span-2">
          <ChannelDetailPanel
            channel={selectedUngrouped}
            occurrence={undefined}
            displayTimezone="Asia/Bangkok"
            showAddToGroup
            onClose={() => setSelectedUngroupedId(null)}
            onChanged={handleChannelChanged}
          />
        </div>
      )}

      {creating && (
        <CreateEditGroupModal
          group={null}
          channels={channels ?? undefined}
          preselectedChannelIds={Array.from(ungroupedSelection)}
          onClose={() => setCreating(false)}
          onSaved={(created) => {
            setGroups((current) => (current ? [created, ...current] : current));
            setUngroupedSelection(new Set());
            setCreating(false);
            setActiveTab("groups");
            setSelectedUngroupedId(null);
            setSelectedId(created.id);
            fetchChannels().then(setChannels).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
