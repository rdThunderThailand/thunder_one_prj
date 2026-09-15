"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { EditIcon, MoreIcon, PlusIcon, ShareNodesIcon, UsersIcon, XIcon } from "@/components/ui/icons";
import { classifyApiError } from "@/lib/api/api-error";
import { deleteChannelGroup, isGroupInUse, updateChannelGroup } from "../services/channel-groups-api";
import { memberHealthCounts } from "../channel-groups-logic";
import type { ChannelListItem } from "../../channels/types";
import type { ChannelGroup } from "../types";
import { CreateEditGroupModal } from "./CreateEditGroupModal";
import { ManageChannelsModal } from "./ManageChannelsModal";

const STATUS_BADGE: Record<ChannelGroup["status"], { label: string; color: BadgeColor }> = {
  active: { label: "Active", color: "green" },
  disabled: { label: "Inactive", color: "zinc" },
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">{value}</dd>
    </div>
  );
}

/** D11 §2's Group Inspector — actions A (Create Program), B (Edit Group), C (Manage Channels),
 *  D (More → Disable / Delete). No cover image or "Current Program": neither has a real per-group
 *  data source yet (same deviation as ticket 07/08/09 for Channels). */
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
  const ModeIcon = group.playback_mode === "synchronized" ? ShareNodesIcon : UsersIcon;
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
      className="relative overflow-hidden p-5 xl:sticky xl:top-0 xl:self-start"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
            <ModeIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">{group.name}</h2>
            <Badge color={status.color} variant="pill">{status.label}</Badge>
          </div>
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

      <div className="mt-4 flex items-center gap-2">
        <Link href={`/media-workspace/publications/create?group=${group.id}`} className={buttonClasses("primary", "flex-1")}>
          <PlusIcon />
          Create Program
        </Link>
        <button type="button" onClick={() => setEditing(true)} className={buttonClasses("secondary", "flex-1")}>
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

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{group.member_count}</p>
          <p className="text-[11px] text-zinc-400">Channels</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{health.online}</p>
          <p className="text-[11px] text-zinc-400">Online</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-red-600 dark:text-red-400">{health.offline}</p>
          <p className="text-[11px] text-zinc-400">Offline</p>
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Channels in this Group ({group.member_count})
          </h3>
          <button
            type="button"
            onClick={() => setManagingChannels(true)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Manage Channels →
          </button>
        </div>
        {group.members.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">No channels yet.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {group.members.map((member) => (
              <Badge key={member.id} variant="pill" color="zinc">{member.name}</Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Group Information
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <DetailItem label="Playback Mode" value={group.playback_mode === "synchronized" ? "Synchronized" : "Independent"} />
          <DetailItem label="Channels" value={String(group.member_count)} />
          <DetailItem label="Created" value={formatDateTime(group.created_at)} />
          <DetailItem label="Last Updated" value={formatDateTime(group.updated_at)} />
        </dl>
      </div>

      {editing && (
        <CreateEditGroupModal
          group={group}
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
