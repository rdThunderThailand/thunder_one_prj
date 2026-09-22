"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { EditIcon, MonitorIcon, MoreIcon, PlusIcon, XIcon } from "@/components/ui/icons";
import { classifyApiError } from "@/lib/api/api-error";
import { deleteChannelGroup, isGroupInUse, updateChannelGroup } from "../services/channel-groups-api";
import { memberHealthCounts } from "../channel-groups-logic";
import type { ChannelListItem } from "../../channels/types";
import type { ChannelGroup } from "../types";
import { CreateEditGroupModal } from "./CreateEditGroupModal";
import { ChannelGroupInspectorSections } from "./ChannelGroupInspectorSections";
import { ManageChannelsModal } from "./ManageChannelsModal";

const STATUS_BADGE: Record<ChannelGroup["status"], { label: string; color: BadgeColor }> = {
  active: { label: "Active", color: "green" },
  disabled: { label: "Inactive", color: "zinc" },
};

/** D11 §2's Group Inspector — actions A (Create Program), B (Edit Group), C (Manage Channels),
 *  D (More → Disable / Delete). */
export function ChannelGroupInspector({
  group,
  channels,
  onClose,
  onChanged,
  onDeleted,
}: {
  group: ChannelGroup;
  channels: ChannelListItem[];
  onClose: () => void;
  onChanged: (updated: ChannelGroup) => void;
  onDeleted: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [managingChannels, setManagingChannels] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = STATUS_BADGE[group.status];
  const health = memberHealthCounts(group, new Map(channels.map((c) => [c.id, c])));

  const toggleStatus = async () => {
    setBusy(true);
    setError(null);
    try {
      onChanged(await updateChannelGroup(group.id, { status: group.status === "active" ? "disabled" : "active" }));
      setMenuOpen(false);
    } catch (caught) {
      setError(classifyApiError(caught, "Could not update this Group. Try again.").message);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteChannelGroup(group.id);
      setConfirmingDelete(false);
      onDeleted();
    } catch (caught) {
      setConfirmingDelete(false);
      const message = caught instanceof Error && isGroupInUse(caught.message)
        ? caught.message
        : classifyApiError(caught, "Could not delete this Group. Try again.").message;
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      role="region"
      aria-label={`${group.name} detail`}
      className="relative h-full overflow-y-auto p-5 xl:sticky xl:top-0 xl:self-start"
    >
      <div className="grid h-28 place-items-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-700 dark:bg-zinc-950/40">
        <div>
          <MonitorIcon className="mx-auto h-6 w-6 text-zinc-400" />
          <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">No preview available yet</p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Program content will appear here.</p>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">{group.name}</h2>
          <Badge color={status.color} variant="pill">{status.label}</Badge>
        </div>
        <button
          type="button"
          aria-label="Close group detail"
          onClick={onClose}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <XIcon />
        </button>
      </div>
      {group.description && (
        <p className="mt-2 text-sm leading-5 text-zinc-500 dark:text-zinc-400">{group.description}</p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-nowrap items-center gap-2">
        <Link href={`/media-workspace/publications/create?group=${group.id}`} className={buttonClasses("primary", "min-w-0 flex-1 whitespace-nowrap px-3")}>
          <PlusIcon />
          Create Program
        </Link>
        <button type="button" onClick={() => setEditing(true)} className={buttonClasses("secondary", "min-w-0 flex-1 whitespace-nowrap px-3")}>
          <EditIcon />
          Edit Group
        </button>
        <div className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-lg border border-zinc-200 p-2.5 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <MoreIcon />
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                aria-hidden="true"
                tabIndex={-1}
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div role="menu" className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  onClick={() => void toggleStatus()}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {group.status === "active" ? "Disable Group" : "Enable Group"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmingDelete(true);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  Delete Group
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ChannelGroupInspectorSections
        group={group}
        health={health}
        onManageChannels={() => setManagingChannels(true)}
      />

      {editing && (
        <CreateEditGroupModal
          group={group}
          onManageChannels={() => {
            setEditing(false);
            setManagingChannels(true);
          }}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            onChanged(updated);
            setEditing(false);
          }}
        />
      )}

      {managingChannels && (
        <ManageChannelsModal
          group={group}
          channels={channels}
          onClose={() => setManagingChannels(false)}
          onSaved={(updated) => {
            onChanged(updated);
            setManagingChannels(false);
          }}
        />
      )}

      <Modal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Delete Channel Group?"
        footer={
          <>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void confirmDelete()}>
              {busy ? "Deleting…" : "Delete Group"}
            </Button>
          </>
        }
      >
        <p>This will permanently delete the group &ldquo;{group.name}&rdquo;.</p>
        <p className="text-zinc-500 dark:text-zinc-400">Channels in this group will not be deleted — they become ungrouped.</p>
      </Modal>
    </Card>
  );
}
