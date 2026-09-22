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
    <div className="flex items-start justify-between gap-3 border-b border-border py-1.5 last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="max-w-[62%] text-right text-xs font-medium text-foreground break-words">{value}</dd>
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
        <div className="rounded-lg border border-border bg-muted px-2 py-2 text-center">
          <p className="text-lg font-semibold text-foreground">{group.member_count}</p>
          <p className="text-[11px] text-muted-foreground">Channels</p>
        </div>
        <div className="rounded-lg border border-border bg-muted px-2 py-2 text-center">
          <p className="text-lg font-semibold text-success">{health.online}</p>
          <p className="text-[11px] text-muted-foreground">Online</p>
        </div>
        <div className="rounded-lg border border-border bg-muted px-2 py-2 text-center">
          <p className="text-lg font-semibold text-danger">{health.offline}</p>
          <p className="text-[11px] text-muted-foreground">Offline</p>
        </div>
        <div className="rounded-lg border border-border bg-muted px-2 py-2 text-center">
          <p className="truncate text-sm font-semibold text-primary">{playbackMode}</p>
          <p className="text-[11px] text-muted-foreground">Playback</p>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Current Program</h3>
          <Link href="/media-workspace/publications" className="text-xs font-medium text-primary hover:text-primary">View Programs →</Link>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">No program scheduled now</p>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Channels in this Group ({group.member_count})</h3>
          <button type="button" onClick={onManageChannels} className="text-xs font-medium text-primary hover:text-primary">Manage Channels →</button>
        </div>
        {group.members.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No channels yet.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {group.members.map((member) => (
              <Badge key={member.id} variant="pill" color="zinc">{member.name}</Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Group Information</h3>
        <dl>
          <DetailItem label="Group ID" value={group.id} />
          <DetailItem label="Name" value={group.name} />
          <DetailItem label="Description" value={group.description || "—"} />
          <DetailItem label="Playback Mode" value={playbackMode} />
          <DetailItem label="Created" value={formatDateTime(group.created_at)} />
          <DetailItem label="Last Updated" value={formatDateTime(group.updated_at)} />
        </dl>
      </div>

      <div className="mt-4 flex gap-2 rounded-lg bg-primary-soft p-3 text-xs text-primary">
        <InfoIcon className="h-4 w-4 shrink-0" />
        Group content is managed through Programs.
      </div>
    </>
  );
}
