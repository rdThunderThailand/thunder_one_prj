import { Card } from "@/components/ui/Card";
import { ChevronDownIcon, FilterIcon, SearchIcon } from "@/components/ui/icons";
import { returnFilterOptions } from "../mock-data";

function FilterSelect({ options }: { options: string[] }) {
  return (
    <span
      title="Not built yet"
      className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
    >
      {options[0]}
      <ChevronDownIcon className="h-3.5 w-3.5 text-t1-gray-400" />
    </span>
  );
}

export function ReturnFilterBar() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-t1-gray-400">
        <SearchIcon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate" title="Not built yet">
          ค้นหา Employee, Asset, Serial, เลขที่เอกสาร...
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        <FilterSelect options={returnFilterOptions.docType} />
        <FilterSelect options={returnFilterOptions.category} />
        <FilterSelect options={returnFilterOptions.department} />
        <FilterSelect options={returnFilterOptions.status} />
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
        >
          <FilterIcon className="h-3.5 w-3.5" />
          ตัวกรองเพิ่มเติม
        </span>
      </div>
    </Card>
  );
}
