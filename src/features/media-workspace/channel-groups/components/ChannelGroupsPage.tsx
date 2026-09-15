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

export function ChannelGroupsPage() {
  const [groups, setGroups] = useState<ChannelGroup[] | null>(null);
  const [channels, setChannels] = useState<ChannelListItem[] | null>(null);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  if (error?.kind === "forbidden") {
    return <NoAccess message={error.message} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Channel Groups" subtitle="Organize channels into groups for easier management and synchronized content." />
      <ChannelGroupsSummaryTiles groups={groups} channels={channels} />

      {error && groups === null ? (
        <Card className="p-6 text-center text-sm text-red-600 dark:text-red-400">{error.message}</Card>
      ) : groups === null || channels === null ? (
        <Card className="p-6 text-center text-sm text-zinc-400">Loading…</Card>
      ) : (
        <div className={selected ? "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]" : "min-w-0"}>
          <Card className="min-w-0 overflow-hidden p-4">
            <Tabs
              items={[
                {
                  key: "groups",
                  label: `Channel Groups (${groups.length})`,
                  content: <ChannelGroupsTable groups={groups} selectedId={selectedId} onSelect={(g) => setSelectedId(g.id)} />,
                },
                {
                  key: "ungrouped",
                  label: `Ungrouped Channels (${ungrouped.length})`,
                  content: (
                    <UngroupedChannelsTable
                      channels={ungrouped}
                      groups={groups}
                      selected={ungroupedSelection}
                      onSelectionChange={setUngroupedSelection}
                      onCreateGroup={() => setCreating(true)}
                      onGroupChanged={handleGroupChanged}
                    />
                  ),
                },
              ]}
            />
          </Card>

          {selected && (
            <ChannelGroupInspector
              key={selected.id}
              group={selected}
              channels={channels}
              onClose={() => setSelectedId(null)}
              onChanged={handleGroupChanged}
              onDeleted={handleGroupDeleted}
            />
          )}
        </div>
      )}

      {creating && (
        <CreateEditGroupModal
          group={null}
          preselectedChannelIds={Array.from(ungroupedSelection)}
          onClose={() => setCreating(false)}
          onSaved={(created) => {
            setGroups((current) => (current ? [created, ...current] : current));
            setUngroupedSelection(new Set());
            setCreating(false);
            setSelectedId(created.id);
            fetchChannels().then(setChannels).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
