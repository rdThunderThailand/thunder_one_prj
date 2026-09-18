export type TagCount = { id: string; name: string; count: number };

const selectedClass = "bg-primary-soft font-medium text-primary";
const itemClass = "text-muted-foreground hover:bg-muted";

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
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <button type="button" onClick={() => onSelect(null)} className={`w-full rounded-lg px-2 py-2 text-left text-sm ${selected === null ? selectedClass : itemClass}`}>
          All
        </button>
        {tags.length === 0 ? <p className="px-2 py-3 text-xs text-muted-foreground">No tags yet</p> : tags.map((tag) => (
          <button key={tag.id} type="button" onClick={() => onSelect(tag.id)} className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm ${selected === tag.id ? selectedClass : itemClass}`}>
            <span className="truncate">{tag.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">{tag.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
