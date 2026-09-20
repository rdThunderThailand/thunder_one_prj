import type { CompositionStatus } from "../types";

export function LayoutInformationCard({ name, resolution, aspectRatio, zoneCount, status }: {
  name: string;
  resolution: string | null;
  aspectRatio: string;
  zoneCount: number;
  status: CompositionStatus;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-3 shadow-panel">
      <h2 className="text-sm font-semibold">Layout Information</h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <dt className="text-muted-foreground">Name</dt><dd className="truncate font-medium">{name || "Untitled Layout"}</dd>
        <dt className="text-muted-foreground">Resolution</dt><dd>{resolution ?? "Custom"}</dd>
        <dt className="text-muted-foreground">Aspect ratio</dt><dd>{aspectRatio}</dd>
        <dt className="text-muted-foreground">Zones</dt><dd>{zoneCount}</dd>
        <dt className="text-muted-foreground">Status</dt><dd className="capitalize">{status}</dd>
      </dl>
    </section>
  );
}
