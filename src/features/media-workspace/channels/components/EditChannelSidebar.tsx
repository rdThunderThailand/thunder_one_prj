import { useState } from "react";
import Link from "next/link";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CalendarIcon, InfoIcon, MonitorIcon, PlayIcon } from "@/components/ui/icons";
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
        <p className="flex items-center gap-1.5 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Channel Preview
          <InfoIcon className="h-4 w-4 text-zinc-400" />
        </p>
        <div className="mt-3 grid min-h-40 place-items-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-center dark:border-zinc-700 dark:bg-zinc-950/40">
          <div>
            <MonitorIcon className="mx-auto h-7 w-7 text-zinc-400" />
            <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">No preview available yet</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Content appears after a Program targets this channel.</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Current Status</p>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950/40">
          <Badge color={status.color}>{status.label}</Badge>
          <span className="text-sm text-zinc-600 dark:text-zinc-300">{status.label === "Online" ? "Running as expected" : "Player connection needs attention"}</span>
        </div>
        <p className="mt-1 text-xs text-zinc-400">Last updated {formatDateTime(channel.updated_at)}</p>
      </Card>

      <Card className="p-5">
        <p className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">Screen Outputs</p>
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

      <Card className="border-indigo-100 bg-indigo-50/70 p-5 dark:border-indigo-500/20 dark:bg-indigo-500/10">
        <div className="flex gap-2">
          <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" />
          <div>
            <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">Manage channel content</p>
            <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-200">Create or schedule content for this channel in Programs.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href="/media-workspace/publications" className={buttonClasses("secondary", "w-full px-2.5 py-2 text-xs text-indigo-700 dark:text-indigo-300")}>
            <PlayIcon className="h-4 w-4" />
            Go to Programs
          </Link>
          <Button type="button" variant="secondary" disabled className="w-full px-2.5 py-2 text-xs">
            <CalendarIcon className="h-4 w-4" />
            Go to Calendar
          </Button>
        </div>
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
