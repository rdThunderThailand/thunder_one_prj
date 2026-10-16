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
    <div className="rounded-2xl border border-warning/30 bg-warning-muted/50 p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <StarIcon
          className="h-4 w-4 text-warning"
          filled
        />
        Do First
      </h2>
      <span className="mb-2 inline-block rounded-full bg-warning-muted px-2 py-0.5 text-[11px] font-semibold text-t1-amber-700">
        {KIND_META[item.kind].label}
      </span>
      <p className="text-lg font-semibold text-foreground">{item.title}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className={`flex items-center gap-1.5 text-xs ${group === "no-due" ? "text-muted-foreground" : GROUP_META[group].text}`}>
            <CalendarIcon className="h-3.5 w-3.5" />
            {item.dateNote}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BoxIcon className="h-3.5 w-3.5" />
            {item.source}
          </span>
        </div>
        <Link
          href={item.href}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <PlayIcon className="h-3.5 w-3.5" />
          Start
        </Link>
      </div>
    </div>
  );
}
