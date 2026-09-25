import Link from "next/link";
import { BoxIcon, CalendarIcon, PlayIcon, StarIcon } from "@/components/ui/icons";
import { dueGroup, type WorkItem } from "../work-items";
import { GROUP_META, KIND_META } from "./work-item-meta";

// The single most urgent open item (`items` arrives sorted by urgency from
// `buildMyWork`). Nothing open → the card isn't rendered at all rather than
// highlighting an empty slot.
export function DoFirstCard({ items, now }: { items: WorkItem[]; now: Date }) {
  const item = items.find((candidate) => candidate.kind !== "waiting");
  if (!item) return null;
  const group = dueGroup(item, now);

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        <StarIcon
          className="h-4 w-4 text-amber-500"
          filled
        />
        Do First
      </h2>
      <span className="mb-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
        {KIND_META[item.kind].label}
      </span>
      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</p>
      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{item.detail}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className={`flex items-center gap-1.5 text-xs ${group === "no-due" ? "text-zinc-500 dark:text-zinc-400" : GROUP_META[group].text}`}>
            <CalendarIcon className="h-3.5 w-3.5" />
            {item.dateNote}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <BoxIcon className="h-3.5 w-3.5" />
            {item.source}
          </span>
        </div>
        <Link
          href={item.href}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          <PlayIcon className="h-3.5 w-3.5" />
          Start
        </Link>
      </div>
    </div>
  );
}
