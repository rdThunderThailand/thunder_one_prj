"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ShareNodesIcon, UsersIcon } from "@/components/ui/icons";
import { classifyApiError, isDuplicateName } from "@/lib/api/api-error";
import { createChannelGroup, isSyncConflict, setChannelGroupMembers, updateChannelGroup } from "../services/channel-groups-api";
import type { ChannelGroup, PlaybackMode } from "../types";

const fieldClasses =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const MODES: { mode: PlaybackMode; label: string; hint: string; icon: typeof ShareNodesIcon }[] = [
  { mode: "synchronized", label: "Synchronized", hint: "All channels play the same content in sync (same timing).", icon: ShareNodesIcon },
  { mode: "independent", label: "Independent", hint: "Each channel can play content independently.", icon: UsersIcon },
];

/** D14 (create, from Ungrouped tab) / D15 (edit). Create takes an optional set of channel ids
 *  pre-selected from the Ungrouped tab's checkboxes — set as members right after creation. */
export function CreateEditGroupModal({
  group,
  preselectedChannelIds,
  onClose,
  onSaved,
}: {
  /** `null` = create mode. */
  group: ChannelGroup | null;
  preselectedChannelIds?: string[];
  onClose: () => void;
  onSaved: (group: ChannelGroup) => void;
}) {
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [mode, setMode] = useState<PlaybackMode>(group?.playback_mode ?? "independent");
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
        !group && preselectedChannelIds?.length
          ? await setChannelGroupMembers(saved.id, preselectedChannelIds)
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

  return (
    <Modal
      open
      onClose={onClose}
      title={group ? "Edit Channel Group" : "Create Channel Group"}
      footer={
        <>
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : group ? "Save Changes" : "Create Group"}
          </Button>
        </>
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
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Description <span className="font-normal text-zinc-400">(optional)</span>
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
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Playback Mode</p>
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
                      ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${selected ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}`} />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        {preselectedChannelIds && preselectedChannelIds.length > 0 && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {preselectedChannelIds.length} channel(s) will be added to this Group.
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
