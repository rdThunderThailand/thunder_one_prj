"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MonitorIcon, SearchIcon } from "@/components/ui/icons";
import type { ChannelListItem } from "../../channels/types";

function matchesSearch(channel: ChannelListItem, query: string): boolean {
  const value = query.trim().toLowerCase();
  return value === "" || channel.name.toLowerCase().includes(value) || (channel.location?.name ?? "").toLowerCase().includes(value);
}

function ChannelRow({
  channel,
  checked,
  onChange,
}: {
  channel: ChannelListItem;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0 hover:bg-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-border text-primary focus:ring-ring/30"
      />
      <MonitorIcon className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{channel.name}</p>
        <p className="truncate text-xs text-muted-foreground">{channel.location?.name ?? "Unassigned"}</p>
      </div>
      <span className={`shrink-0 text-xs ${channel.health === "online" ? "text-success" : "text-muted-foreground"}`}>
        {channel.health ?? "No player"}
      </span>
    </label>
  );
}

export function CreateGroupChannelsModal({
  channels,
  selectedIds,
  title = "Manage Channels",
  description = "Choose the channels to add to this group.",
  selectedTitle = "Channels to Add",
  selectedEmptyMessage = "Select a channel from the available list.",
  saveLabel = "Save Selection",
  onClose,
  onSave,
}: {
  channels: ChannelListItem[];
  selectedIds: Set<string>;
  title?: string;
  description?: string;
  selectedTitle?: string;
  selectedEmptyMessage?: string;
  saveLabel?: string;
  onClose: () => void;
  onSave: (selected: Set<string>) => void | Promise<string | void>;
}) {
  const [draft, setDraft] = useState<Set<string>>(() => new Set(selectedIds));
  const [availableSearch, setAvailableSearch] = useState("");
  const [selectedSearch, setSelectedSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = useMemo(
    () => channels.filter((channel) => !draft.has(channel.id) && matchesSearch(channel, availableSearch)),
    [availableSearch, channels, draft]
  );
  const selected = useMemo(
    () => channels.filter((channel) => draft.has(channel.id) && matchesSearch(channel, selectedSearch)),
    [channels, draft, selectedSearch]
  );

  const toggle = (id: string) => {
    setDraft((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await onSave(draft);
      if (typeof result === "string") setError(result);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={description}
      size="xl"
      showCloseButton
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : saveLabel}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-foreground">Available Channels</h3>
            <span className="text-xs text-muted-foreground">{available.length}</span>
          </div>
          <label className="relative mt-3 block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={availableSearch}
              onChange={(event) => setAvailableSearch(event.target.value)}
              placeholder="Search channels…"
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </label>
          <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-border">
            {available.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No available channels.</p> : available.map((channel) => <ChannelRow key={channel.id} channel={channel} checked={false} onChange={() => toggle(channel.id)} />)}
          </div>
        </section>

        <section className="rounded-xl border border-primary/30 bg-primary-soft p-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-foreground">{selectedTitle}</h3>
            <span className="text-xs text-primary">{draft.size} selected</span>
          </div>
          <label className="relative mt-3 block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={selectedSearch}
              onChange={(event) => setSelectedSearch(event.target.value)}
              placeholder="Search selected channels…"
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </label>
          <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-primary/30 bg-card">
            {selected.length === 0 ? <p className="p-4 text-sm text-muted-foreground">{selectedEmptyMessage}</p> : selected.map((channel) => <ChannelRow key={channel.id} channel={channel} checked onChange={() => toggle(channel.id)} />)}
          </div>
        </section>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}
