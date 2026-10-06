"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon, SearchIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/lovable/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
import { fetchChannelGroups } from "../../channel-groups/services/channel-groups-api";
import type { ChannelGroup } from "../../channel-groups/types";
import { ALL_CHANNELS, sameScope, type ChannelScope } from "../channel-scope";
import { fetchChannels } from "../services/channels-api";
import type { ChannelListItem } from "../types";

type Tab = "channels" | "groups";
type Option = { scope: ChannelScope; label: string; count?: number; disabled?: boolean };

/** "All Channels ▾" trigger + popover (ADR 0084 §2). The scope is applied only on Apply. */
export function ChannelScopePicker({ value, onApply }: { value: ChannelScope; onApply: (scope: ChannelScope) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ChannelScope>(value);
  const [tab, setTab] = useState<Tab>(value.kind === "group" ? "groups" : "channels");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<{ channels: ChannelListItem[]; groups: ChannelGroup[] } | null>(null);
  const [failed, setFailed] = useState(false);

  // The label needs the chosen name, so a non-All scope loads before the popover is ever opened.
  const needsData = open || value.kind !== "all";
  useEffect(() => {
    if (!needsData || data || failed) return;
    Promise.all([fetchChannels(), fetchChannelGroups()])
      .then(([channels, groups]) => setData({ channels, groups }))
      .catch(() => setFailed(true));
  }, [needsData, data, failed]);

  const activeChannels = data?.channels.filter((channel) => channel.lifecycle === "active") ?? [];
  const channelOptions: Option[] = [
    { scope: ALL_CHANNELS, label: "All Channels", count: activeChannels.length },
    ...(data?.channels.filter((channel) => channel.lifecycle !== "draft") ?? []).map((channel) => ({
      scope: { kind: "channel", id: channel.id } as const,
      label: channel.name,
    })),
  ];
  const groupOptions: Option[] = (data?.groups ?? []).map((group) => ({
    scope: { kind: "group", id: group.id } as const,
    label: group.name,
    count: group.members.length,
    disabled: group.status === "disabled",
  }));
  const needle = search.trim().toLowerCase();
  const visible = (tab === "channels" ? channelOptions : groupOptions).filter((option) =>
    option.label.toLowerCase().includes(needle),
  );

  const triggerLabel =
    [...channelOptions, ...groupOptions].find((option) => sameScope(option.scope, value))?.label ?? "All Channels";

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(value);
      setTab(value.kind === "group" ? "groups" : "channels");
      setSearch("");
    }
    setOpen(next);
  };

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="max-w-56 justify-between gap-2"
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDownIcon className="h-3.5 w-3.5 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex w-80 flex-col gap-3"
      >
        <Tabs
          value={tab}
          onValueChange={(next) => setTab(next as Tab)}
        >
          <TabsList className="w-full">
            <TabsTrigger
              value="channels"
              className="flex-1"
            >
              Channels
            </TabsTrigger>
            <TabsTrigger
              value="groups"
              className="flex-1"
            >
              Groups
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tab === "channels" ? "Search channels…" : "Search groups…"}
            aria-label="Search"
            className="pl-8"
          />
        </div>
        <div
          role="radiogroup"
          aria-label={tab === "channels" ? "Channels" : "Groups"}
          className="flex max-h-64 flex-col gap-0.5 overflow-y-auto"
        >
          {failed && <p className="px-2 py-3 text-sm text-danger">Could not load Channels. Close and try again.</p>}
          {!failed && !data && <p className="px-2 py-3 text-sm text-muted-foreground">Loading…</p>}
          {data && visible.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">Nothing matches.</p>}
          {visible.map((option) => (
            <label
              key={option.scope.kind === "all" ? "all" : option.scope.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
            >
              <input
                type="radio"
                name="channel-scope"
                className="accent-primary"
                checked={sameScope(option.scope, draft)}
                disabled={option.disabled}
                onChange={() => setDraft(option.scope)}
              />
              <span className="flex-1 truncate">{option.label}</span>
              {option.count !== undefined && <span className="text-xs text-muted-foreground">{option.count}</span>}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
