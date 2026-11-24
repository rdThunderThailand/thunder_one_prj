import { cn } from "@/lib/utils";

const CARD = "rounded-xl border border-border bg-card p-4 shadow-panel";

function Bar({ className }: { className: string }) {
  return <div className={cn("animate-pulse rounded bg-muted", className)} />;
}

/** A card's icon tile + title, as EditCard draws it. */
function CardHead({ hint = true }: { hint?: boolean }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-muted" />
      <div className="flex flex-col gap-1.5 pt-1">
        <Bar className="h-3 w-32" />
        {hint && <Bar className="h-2 w-52" />}
      </div>
    </div>
  );
}

function RailRows({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <Bar className="h-2.5 w-16" />
          <Bar className="h-2.5 w-24" />
        </div>
      ))}
    </div>
  );
}

/** The Edit page's first paint: same header row, four cards and rail as the loaded page. */
export function ProgramEditSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">Loading Program</span>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Bar className="h-3 w-56" />
        <div className="flex gap-2">
          <Bar className="h-8 w-20" />
          <Bar className="h-8 w-20" />
          <Bar className="h-8 w-28" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <section className={CARD}>
            <CardHead hint={false} />
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="flex flex-col gap-3">
                <Bar className="h-9 w-full" />
                <Bar className="h-20 w-full" />
                <Bar className="h-9 w-40" />
              </div>
              <div className="aspect-video animate-pulse rounded-lg bg-muted" />
            </div>
          </section>
          <section className={CARD}>
            <CardHead />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="h-40 animate-pulse rounded-lg bg-muted" />
              <div className="h-40 animate-pulse rounded-lg bg-muted" />
            </div>
          </section>
          <div className="grid gap-4 md:grid-cols-2">
            <section className={CARD}>
              <CardHead />
              <Bar className="h-10 w-full" />
            </section>
            <section className={CARD}>
              <CardHead />
              <Bar className="h-10 w-full" />
            </section>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <section className={CARD}>
            <Bar className="mb-3 h-3 w-28" />
            <Bar className="h-5 w-14 rounded-full" />
          </section>
          <section className={CARD}>
            <Bar className="mb-3 h-3 w-40" />
            <Bar className="h-9 w-full" />
          </section>
          <section className={CARD}>
            <Bar className="mb-3 h-3 w-36" />
            <RailRows count={5} />
          </section>
        </div>
      </div>
    </div>
  );
}
