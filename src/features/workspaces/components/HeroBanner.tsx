import { GridIcon } from "@/components/ui/icons";

// Decorative — the stacked "app window" mockups on the right are a plain CSS
// approximation of the reference's illustration, not a real preview of
// anything.
export function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-t1-blue-100 bg-gradient-to-r from-accent via-info-muted to-accent p-6">
      <div className="flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
          <GridIcon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            One Platform. Many Workspaces.
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Each workspace is a powerful application, purpose-built for your team.
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute -right-6 top-1/2 hidden h-28 w-64 -translate-y-1/2 sm:block" aria-hidden="true">
        <div className="absolute right-24 top-2 h-20 w-36 rounded-lg border border-t1-white/60 bg-card/70 shadow-md">
          <div className="flex gap-1 border-b border-border p-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-t1-gray-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-t1-gray-300" />
          </div>
        </div>
        <div className="absolute right-8 top-8 h-24 w-40 rounded-lg border border-t1-white/70 bg-card/90 shadow-lg">
          <div className="flex gap-1 border-b border-border p-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-t1-blue-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-info" />
          </div>
          <div className="space-y-1 p-2">
            <div className="h-1.5 w-3/4 rounded-full bg-muted" />
            <div className="h-1.5 w-1/2 rounded-full bg-muted" />
          </div>
        </div>
        <div className="absolute right-0 top-14 h-16 w-28 rounded-lg border border-t1-white/60 bg-card/70 shadow-md">
          <div className="flex gap-1 border-b border-border p-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
          </div>
        </div>
      </div>
    </div>
  );
}
