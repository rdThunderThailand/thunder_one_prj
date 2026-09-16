import { useState } from "react";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ChannelGroupsPickerModal } from "./ChannelGroupsPickerModal";
import { ChannelStructureTree } from "./ChannelStructureTree";
import { ChannelLifecycleActions } from "./ChannelLifecycleActions";
import type { ChannelDetail, ChannelStatusFilter } from "../types";

const STATUS_BADGE: Record<ChannelStatusFilter, { label: string; color: BadgeColor }> = {
  online: { label: "Online", color: "green" },
  warning: { label: "Warning", color: "yellow" },
  offline: { label: "Offline", color: "red" },
  no_player: { label: "No player", color: "zinc" },
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

/** The Edit page's right rail — Status, Channel Structure and Groups read from the live Channel
 *  (same sections as the D1 detail panel, ticket 07), plus the Deactivate/Delete lifecycle card. */
export function EditChannelSidebar({
  channel,
  onChanged,
  onDeleted,
}: {
  channel: ChannelDetail;
  onChanged: (updated: ChannelDetail) => void;
  onDeleted: () => void;
}) {
  const status = STATUS_BADGE[channel.health ?? "no_player"];
  const groups = channel.groups ?? [];
  const [managingGroups, setManagingGroups] = useState(false);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <Card className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Status</p>
        <div className="mt-2 flex items-center gap-2">
          <Badge color={status.color}>{status.label}</Badge>
        </div>
        <p className="mt-1 text-xs text-zinc-400">Last updated {formatDateTime(channel.updated_at)}</p>
      </Card>

      <Card className="p-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Channel Structure</p>
        <ChannelStructureTree channel={channel} />
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Groups ({groups.length})</p>
          <button
            type="button"
            onClick={() => setManagingGroups(true)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Manage →
          </button>
        </div>
        {groups.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">No Groups yet</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {groups.map((group) => (
              <Badge key={group.id} variant="pill" color="indigo">{group.name}</Badge>
            ))}
          </div>
        )}
      </Card>

      {managingGroups && (
        <ChannelGroupsPickerModal
          channel={channel}
          onClose={() => setManagingGroups(false)}
          onSaved={(updated) => {
            setManagingGroups(false);
            onChanged(updated);
          }}
        />
      )}

      <ChannelLifecycleActions
        channelId={channel.id}
        lifecycle={channel.lifecycle}
        revision={channel.revision}
        onChanged={onChanged}
        onDeleted={onDeleted}
      />
    </div>
  );
}
