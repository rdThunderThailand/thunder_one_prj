import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export type TagCount = { id: string; name: string; count: number };

// Same row treatment as ContentFolderRail (Lovable `FolderTree`).
const rowClass = (active: boolean) =>
  cn(
    "flex h-8 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-[10px] font-medium",
    active ? "bg-primary-soft text-primary" : "hover:bg-muted",
  );

export function TagsRail({
  tags,
  selected,
  onSelect,
}: {
  tags: TagCount[];
  selected: string | null;
  onSelect: (tagId: string | null) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        <button type="button" onClick={() => onSelect(null)} className={rowClass(selected === null)}>
          <Tag className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">All</span>
        </button>
        {tags.length === 0 ? (
          <p className="px-2 py-3 text-[10px] text-muted-foreground">No tags yet</p>
        ) : (
          tags.map((tag) => (
            <button key={tag.id} type="button" onClick={() => onSelect(tag.id)} className={rowClass(selected === tag.id)}>
              <Tag className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{tag.name}</span>
              <span className="text-[8px] text-muted-foreground">{tag.count}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
