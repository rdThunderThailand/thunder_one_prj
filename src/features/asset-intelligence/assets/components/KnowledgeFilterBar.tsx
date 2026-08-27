import { Card } from "@/components/ui/Card";
import { ChevronDownIcon, RepeatIcon, SearchIcon } from "@/components/ui/icons";
import { knowledgeFilterOptions } from "../mock-data";

function FilterSelect({ options }: { options: string[] }) {
  return (
    <span
      title="Not built yet"
      className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
    >
      {options[0]}
      <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
    </span>
  );
}

export function KnowledgeFilterBar() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700">
        <SearchIcon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate" title="Not built yet">
          ค้นหาบทความ...
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        <FilterSelect options={knowledgeFilterOptions.category} />
        <FilterSelect options={knowledgeFilterOptions.contentType} />
        <FilterSelect options={knowledgeFilterOptions.tag} />
        <FilterSelect options={knowledgeFilterOptions.status} />
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          <RepeatIcon className="h-3.5 w-3.5" />
          ล้างตัวกรอง
        </span>
      </div>
    </Card>
  );
}
