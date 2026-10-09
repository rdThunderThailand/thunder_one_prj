"use client";

import { Badge } from "@/components/ui/lovable/badge";
import { isInUse } from "../asset-usage";
import { useAssetUsage } from "../useAssetUsage";
import { UsageGroups } from "./UsageLists";

/** Media Detail's "where it's used" card (ADR 0091 Decision 6). */
export function UsagePanel({ assetId }: { assetId: string }) {
  const { usage, loading, failed } = useAssetUsage([assetId]);
  const current = usage?.[assetId];
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-panel" aria-label="Usage">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold">Usage (Where it&apos;s used)</h2>
        {current?.programs.some((program) => program.onAir) && <Badge variant="success">On air</Badge>}
      </div>
      <div className="mt-3 space-y-3">
        {loading && (
          <p role="status" className="text-[11px] text-muted-foreground">
            Loading usage…
          </p>
        )}
        {failed && <p className="rounded-lg bg-muted p-3 text-[11px] leading-5 text-muted-foreground">Usage could not be loaded.</p>}
        {current && (isInUse(current) ? <UsageGroups usage={current} /> : <p className="rounded-lg bg-muted p-3 text-[11px] leading-5 text-muted-foreground">Not used anywhere.</p>)}
        {current && current.coverOf.length > 0 && (
          <p className="text-[11px] text-muted-foreground">Cover of {current.coverOf.map((playlist) => playlist.name).join(", ")}.</p>
        )}
        {current?.history && <p className="text-[11px] text-muted-foreground">Has broadcast history — kept for Playback Proof.</p>}
      </div>
    </section>
  );
}
