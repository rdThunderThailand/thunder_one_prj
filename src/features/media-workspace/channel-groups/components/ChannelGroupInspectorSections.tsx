import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { InfoIcon } from "@/components/ui/icons";
import type { ChannelGroup } from "../types";

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-zinc-100 py-1.5 last:border-0 dark:border-zinc-800">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="max-w-[62%] text-right text-xs font-medium text-zinc-800 break-words dark:text-zinc-200">{value}</dd>
    </div>
  );
}

export function ChannelGroupInspectorSections({
  group,
  health,
  onManageChannels,
}: {
  group: ChannelGroup;
  health: { online: number; offline: number; warning: number };
  onManageChannels: () => void;
}) {
  const playbackMode = group.playback_mode === "synchronized" ? "Synchronized" : "Independent";

  return (
    <>
      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-2 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{group.member_count}</p>
          <p className="text-[11px] text-zinc-400">Channels</p>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-2 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{health.online}</p>
          <p className="text-[11px] text-zinc-400">Online</p>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-2 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
          <p className="text-lg font-semibold text-red-600 dark:text-red-400">{health.offline}</p>
          <p className="text-[11px] text-zinc-400">Offline</p>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-2 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
          <p className="truncate text-sm font-semibold text-indigo-600 dark:text-indigo-300">{playbackMode}</p>
          <p className="text-[11px] text-zinc-400">Playback</p>
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Current Program</h3>
          <Link href="/media-workspace/publications" className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">View Programs →</Link>
        </div>
        <p className="mt-2 text-sm text-zinc-400">No program scheduled now</p>
      </div>

      <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Channels in this Group ({group.member_count})</h3>
          <button type="button" onClick={onManageChannels} className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Manage Channels →</button>
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
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Group Information</h3>
        <dl>
          <DetailItem label="Group ID" value={group.id} />
          <DetailItem label="Name" value={group.name} />
          <DetailItem label="Description" value={group.description || "—"} />
          <DetailItem label="Playback Mode" value={playbackMode} />
          <DetailItem label="Created" value={formatDateTime(group.created_at)} />
          <DetailItem label="Last Updated" value={formatDateTime(group.updated_at)} />
        </dl>
      </div>

      <div className="mt-4 flex gap-2 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-200">
        <InfoIcon className="h-4 w-4 shrink-0" />
        Group content is managed through Programs.
      </div>
    </>
  );
}
