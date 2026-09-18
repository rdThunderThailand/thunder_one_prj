"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { InfoIcon, MonitorIcon, PlusIcon, ShareNodesIcon, UsersIcon } from "@/components/ui/icons";
import { classifyApiError, isDuplicateName } from "@/lib/api/api-error";
import { createChannelGroup, isSyncConflict, setChannelGroupMembers, updateChannelGroup } from "../services/channel-groups-api";
import type { ChannelListItem } from "../../channels/types";
import { CreateGroupChannelsModal } from "./CreateGroupChannelsModal";
import type { ChannelGroup, PlaybackMode } from "../types";

const fieldClasses =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

const MODES: { mode: PlaybackMode; label: string; hint: string; icon: typeof ShareNodesIcon }[] = [
  { mode: "synchronized", label: "Synchronized", hint: "All channels play the same content in sync (same timing).", icon: ShareNodesIcon },
  { mode: "independent", label: "Independent", hint: "Each channel can play content independently.", icon: UsersIcon },
];

/** D14 (create, from Ungrouped tab) / D15 (edit). Create takes an optional set of channel ids
 *  pre-selected from the Ungrouped tab's checkboxes — set as members right after creation. */
export function CreateEditGroupModal({
  group,
  channels,
  preselectedChannelIds,
  onManageChannels,
  onClose,
  onSaved,
}: {
  /** `null` = create mode. */
  group: ChannelGroup | null;
  channels?: ChannelListItem[];
  preselectedChannelIds?: string[];
  onManageChannels?: () => void;
  onClose: () => void;
  onSaved: (group: ChannelGroup) => void;
}) {
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [mode, setMode] = useState<PlaybackMode>(group?.playback_mode ?? "independent");
  const [selectedChannelIds, setSelectedChannelIds] = useState<Set<string>>(() => new Set(preselectedChannelIds));
  const [managingChannels, setManagingChannels] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (name.trim() === "") {
      setNameError("Group name is required");
      return;
    }
    setNameError(undefined);
    setError(null);
    setSaving(true);
    try {
      const saved = group
        ? await updateChannelGroup(group.id, { name, description: description || null, playback_mode: mode })
        : await createChannelGroup({ name, description: description || null, playback_mode: mode });
      const withMembers =
        !group && selectedChannelIds.size > 0
          ? await setChannelGroupMembers(saved.id, Array.from(selectedChannelIds))
          : saved;
      onSaved(withMembers);
    } catch (caught) {
      if (caught instanceof Error && isDuplicateName(caught.message)) {
        setNameError("A Channel Group with this name already exists.");
      } else if (caught instanceof Error && isSyncConflict(caught.message)) {
        setError("A channel can only belong to one synchronized Group at a time. Remove it from the other Group first.");
      } else {
        setError(classifyApiError(caught, "Could not save this Channel Group. Try again.").message);
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedChannels = channels?.filter((channel) => selectedChannelIds.has(channel.id)) ?? [];

  return (
    <>
      <Modal
      open
      onClose={onClose}
      title={group ? "Edit Channel Group" : "Create Channel Group"}
      description={group ? "Update group information and settings." : "Create a new group and add channels in one step."}
      size="form"
      showCloseButton
      footer={
        <div className="flex w-full justify-between gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : group ? "Save Changes" : "Create Group"}
          </Button>
        </div>
      }
      >
        <div className="flex flex-col gap-4">
        <Input
          name="group-name"
          label="Group Name *"
          value={name}
          error={nameError}
          placeholder="e.g. All Restaurant Screens"
          onChange={(event) => setName(event.target.value)}
        />
        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
          Description <span className="font-normal text-muted-foreground">(optional)</span>
          <textarea
            value={description}
            maxLength={300}
            rows={2}
            placeholder="Describe what this group is for."
            onChange={(event) => setDescription(event.target.value)}
            className={`${fieldClasses} resize-y`}
          />
        </label>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Playback Mode</p>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            {MODES.map(({ mode: m, label, hint, icon: Icon }) => {
              const selected = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={selected}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
                    selected
                      ? "border-primary bg-primary-soft"
                      : "border-border hover:border-border"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <span className="text-[11px] text-muted-foreground">{hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        {!group && (
          <section className="border-t border-border pt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">Channels to Add ({selectedChannelIds.size})</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Selected channels will be added to this group.</p>
              </div>
              <Button type="button" variant="secondary" className="!px-3 !py-2 text-xs" onClick={() => setManagingChannels(true)}>
                <PlusIcon className="h-4 w-4" />
                Add More Channels
              </Button>
            </div>
            <div className="mt-3 max-h-36 overflow-y-auto rounded-lg border border-border">
              {selectedChannels.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No channels selected yet.</p>
              ) : (
                selectedChannels.map((channel) => (
                  <div key={channel.id} className="flex items-center gap-2 border-b border-border px-3 py-2 last:border-b-0">
                    <MonitorIcon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{channel.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{channel.location?.name ?? "Unassigned"}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex gap-2 rounded-lg bg-primary-soft px-3 py-2 text-xs text-primary">
              <InfoIcon className="h-4 w-4 shrink-0" />
              You can add or remove channels later from the group details.
            </div>
          </section>
        )}

        {group && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-primary-soft px-3 py-3 text-sm text-primary">
            <div className="flex min-w-0 gap-2">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <p>You can manage which channels belong to this group from the Manage Channels action.</p>
            </div>
            <Button type="button" variant="secondary" className="shrink-0 !px-3 !py-2 text-xs" onClick={onManageChannels}>
              Manage Channels
            </Button>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        </div>
      </Modal>
      {managingChannels && channels && (
        <CreateGroupChannelsModal
          channels={channels}
          selectedIds={selectedChannelIds}
          onClose={() => setManagingChannels(false)}
          onSave={(selected) => {
            setSelectedChannelIds(selected);
            setManagingChannels(false);
          }}
        />
      )}
    </>
  );
}
