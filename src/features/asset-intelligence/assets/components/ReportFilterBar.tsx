import { Card } from "@/components/ui/Card";
import { ChevronDownIcon, FilterIcon } from "@/components/ui/icons";
import { reportFilterOptions } from "../mock-data";

function FilterSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <span
      title="Not built yet"
      className="flex cursor-not-allowed flex-col gap-0.5 rounded-lg border border-zinc-200 px-3 py-1.5 dark:border-zinc-700"
    >
      <span className="text-[10px] text-zinc-400">{label}</span>
      <span className="flex items-center justify-between gap-2 text-sm text-zinc-700 dark:text-zinc-200">
        {options[0]}
        <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
      </span>
    </span>
  );
}

export function ReportFilterBar() {
  return (
    <Card className="flex flex-wrap items-center gap-2 p-3">
      <FilterSelect label="ช่วงเวลา" options={reportFilterOptions.period} />
      <FilterSelect label="เปรียบเทียบกับ" options={reportFilterOptions.compare} />
      <FilterSelect label="สถานที่" options={reportFilterOptions.location} />
      <span
        title="Not built yet"
        className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
      >
        <FilterIcon className="h-3.5 w-3.5" />
        ตัวกรองเพิ่มเติม
      </span>
    </Card>
  );
}
