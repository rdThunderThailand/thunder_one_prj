import type { PublicationTarget } from "../../types";

/** Right column of Change Target: what Apply will store, plus the Target Summary (Channels + Locations). */
export function SelectedTargetPanel({
  rows,
  summary,
  onClear,
  onRemove,
}: {
  rows: PublicationTarget[];
  summary: { channels: number; locations: number };
  onClear: () => void;
  onRemove: (target: PublicationTarget) => void;
}) {
  return (
    <aside className="flex min-w-0 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Selected Target ({rows.length})</p>
        <button
          type="button"
          className="text-xs font-medium text-primary"
          onClick={onClear}
        >
          Clear all
        </button>
      </div>
      <ul className="flex max-h-[16rem] flex-col gap-1 overflow-y-auto">
        {rows.map((target) => {
          const id = (target.channel_id ?? target.group_id)!;
          return (
            <li
              key={`${target.target_type}:${id}`}
              className="flex items-center justify-between gap-2 rounded-md bg-muted px-2.5 py-1.5 text-sm"
            >
              <span className="truncate">
                {target.name ?? id}
                {target.target_type === "group" && <span className="ml-1 text-xs text-muted-foreground">Group</span>}
              </span>
              <button
                type="button"
                aria-label={`Remove ${target.name ?? id}`}
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onRemove(target)}
              >
                ×
              </button>
            </li>
          );
        })}
        {rows.length === 0 && <li className="text-xs text-muted-foreground">Nothing selected.</li>}
      </ul>
      <div className="mt-auto rounded-lg border border-border p-3">
        <p className="mb-2 text-sm font-semibold text-foreground">Target Summary</p>
        <dl className="grid grid-cols-2 gap-2 text-center">
          <div>
            <dd className="text-xl font-semibold text-foreground">{summary.channels}</dd>
            <dt className="text-xs text-muted-foreground">Channels</dt>
          </div>
          <div>
            <dd className="text-xl font-semibold text-foreground">{summary.locations}</dd>
            <dt className="text-xs text-muted-foreground">Locations</dt>
          </div>
        </dl>
      </div>
    </aside>
  );
}
