import { Card } from "@/components/ui/Card";
import { ChevronDownIcon, FilterIcon, GridIcon, ListIcon, SearchIcon } from "@/components/ui/icons";

const FILTERS = ["หมวดหมู่", "ประเภทเนื้อหา", "แท็ก"];

// Every control here is decorative — no search/filter backend exists yet,
// same convention as people/personnel's PersonnelFilterBar.
export function KnowledgeBaseFilterBar() {
  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-t1-gray-400">
        <SearchIcon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate" title="Not built yet">
          ค้นหาความรู้, คู่มือ, นโยบาย, หรือคำถามที่พบบ่อย...
        </span>
      </div>
      {FILTERS.map((label) => (
        <span
          key={label}
          title="Not built yet"
          className="flex shrink-0 cursor-not-allowed items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
        >
          {label}: ทั้งหมด
          <ChevronDownIcon className="h-3.5 w-3.5 text-t1-gray-400" />
        </span>
      ))}
      <span
        title="Not built yet"
        className="flex shrink-0 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
      >
        <FilterIcon className="h-3.5 w-3.5" />
        ตัวกรองเพิ่มเติม
      </span>
      <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border p-1">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-primary">
          <GridIcon className="h-3.5 w-3.5" />
        </span>
        <span
          title="Not built yet"
          className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-md text-t1-gray-400"
        >
          <ListIcon className="h-3.5 w-3.5" />
        </span>
      </div>
    </Card>
  );
}
