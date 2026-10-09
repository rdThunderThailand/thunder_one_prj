import Link from "next/link";
import { Badge } from "@/components/ui/lovable/badge";
import type { AssetDeleteBlockers, AssetUsage, AssetUsageRef } from "@/types/domain";
import { blockerSummary, usageSummary } from "../asset-usage";

const HREF = {
  playlist: (id: string) => `/media-workspace/playlists/${id}`,
  layout: (id: string) => `/media-workspace/compositions/${id}`,
  program: (id: string) => `/media-workspace/program/${id}`,
};

function RefLink({ href, children, note }: { href: string; children: React.ReactNode; note?: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <Link href={href} className="min-w-0 truncate text-primary hover:underline">
        {children}
      </Link>
      {note && <span className="shrink-0 text-muted-foreground">{note}</span>}
    </li>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="mt-1 space-y-0.5 text-xs">{children}</ul>
    </div>
  );
}

function refs(items: AssetUsageRef[]) {
  return items.map((item) => item.name).join(", ");
}

/** The three Usage groups of one Asset (Media Detail panel and the Trash warning). */
export function UsageGroups({ usage }: { usage: AssetUsage }) {
  return (
    <div className="space-y-3">
      {usage.playlists.length > 0 && (
        <Group title="Playlists">
          {usage.playlists.map((playlist) => (
            <RefLink key={playlist.id} href={HREF.playlist(playlist.id)}>
              {playlist.name}
            </RefLink>
          ))}
        </Group>
      )}
      {usage.layouts.length > 0 && (
        <Group title="Layouts">
          {usage.layouts.map((layout) => (
            <RefLink key={layout.id} href={HREF.layout(layout.id)} note={layout.viaPlaylists.length > 0 ? `via ${refs(layout.viaPlaylists)}` : undefined}>
              {layout.name}
            </RefLink>
          ))}
        </Group>
      )}
      {usage.programs.length > 0 && (
        <Group title="Programs">
          {usage.programs.map((program) => (
            <li key={program.id} className="flex items-center gap-1.5">
              <Link href={HREF.program(program.id)} className="min-w-0 truncate text-primary hover:underline">
                {program.name}
              </Link>
              {program.onAir ? <Badge variant="success">On air</Badge> : <span className="shrink-0 capitalize text-muted-foreground">{program.status}</span>}
            </li>
          ))}
        </Group>
      )}
    </div>
  );
}

/** One collapsible row per in-use Asset: label, summary, expandable groups. */
export function UsageEntries({ entries }: { entries: Array<{ id: string; label: string; usage: AssetUsage }> }) {
  return (
    <div className="max-h-64 space-y-1.5 overflow-y-auto">
      {entries.map((entry) => (
        <details key={entry.id} className="rounded-lg border border-border bg-muted px-3 py-2">
          <summary className="cursor-pointer text-xs">
            <span className="font-semibold">{entry.label}</span>
            <span className="ml-2 text-muted-foreground">{usageSummary(entry.usage)}</span>
          </summary>
          <div className="mt-2">
            <UsageGroups usage={entry.usage} />
          </div>
        </details>
      ))}
    </div>
  );
}

/** A refused Permanent delete: why each Asset stays, history first. */
export function BlockedEntries({ entries }: { entries: Array<{ id: string; label: string; blockers: AssetDeleteBlockers }> }) {
  return (
    <div className="max-h-64 space-y-1.5 overflow-y-auto">
      {entries.map((entry) => (
        <details key={entry.id} className="rounded-lg border border-border bg-muted px-3 py-2">
          <summary className="cursor-pointer text-xs">
            <span className="font-semibold">{entry.label}</span>
            <span className="ml-2 text-muted-foreground">{blockerSummary(entry.blockers)}</span>
          </summary>
          <div className="mt-2 space-y-3">
            {entry.blockers.playlists.length > 0 && (
              <Group title="Playlists">
                {entry.blockers.playlists.map((playlist) => (
                  <RefLink key={playlist.id} href={HREF.playlist(playlist.id)} note={playlist.trashed ? "in Trash" : undefined}>
                    {playlist.name}
                  </RefLink>
                ))}
              </Group>
            )}
            {entry.blockers.layouts.length > 0 && (
              <Group title="Layouts">
                {entry.blockers.layouts.map((layout) => (
                  <RefLink key={layout.id} href={HREF.layout(layout.id)} note={layout.trashed ? "in Trash" : undefined}>
                    {layout.name}
                  </RefLink>
                ))}
              </Group>
            )}
            {entry.blockers.programs.length > 0 && (
              <Group title="Programs">
                {entry.blockers.programs.map((program) => (
                  <RefLink key={program.id} href={HREF.program(program.id)} note={program.status}>
                    {program.name}
                  </RefLink>
                ))}
              </Group>
            )}
            {entry.blockers.history && (
              <p className="text-xs text-muted-foreground">
                This file has aired, so Playback Proof keeps it. Removing the references above does not make it deletable.
              </p>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
