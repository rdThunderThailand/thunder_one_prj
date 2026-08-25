import { GridIcon } from "@/components/ui/icons";

// Decorative — the stacked "app window" mockups on the right are a plain CSS
// approximation of the reference's illustration, not a real preview of
// anything.
export function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 p-6 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:via-blue-500/10 dark:to-indigo-500/10">
      <div className="flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-indigo-400">
          <GridIcon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            One Platform. Many Workspaces.
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Each workspace is a powerful application, purpose-built for your team.
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute -right-6 top-1/2 hidden h-28 w-64 -translate-y-1/2 sm:block" aria-hidden="true">
        <div className="absolute right-24 top-2 h-20 w-36 rounded-lg border border-white/60 bg-white/70 shadow-md dark:border-white/10 dark:bg-white/5">
          <div className="flex gap-1 border-b border-zinc-100 p-1.5 dark:border-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
          </div>
        </div>
        <div className="absolute right-8 top-8 h-24 w-40 rounded-lg border border-white/70 bg-white/90 shadow-lg dark:border-white/10 dark:bg-zinc-900/80">
          <div className="flex gap-1 border-b border-zinc-100 p-1.5 dark:border-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
          </div>
          <div className="space-y-1 p-2">
            <div className="h-1.5 w-3/4 rounded-full bg-zinc-100 dark:bg-white/10" />
            <div className="h-1.5 w-1/2 rounded-full bg-zinc-100 dark:bg-white/10" />
          </div>
        </div>
        <div className="absolute right-0 top-14 h-16 w-28 rounded-lg border border-white/60 bg-white/70 shadow-md dark:border-white/10 dark:bg-white/5">
          <div className="flex gap-1 border-b border-zinc-100 p-1.5 dark:border-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
