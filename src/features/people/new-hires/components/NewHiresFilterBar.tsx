import { Card } from "@/components/ui/Card";
import { ChevronDownIcon, FilterIcon, ListIcon, SearchIcon } from "@/components/ui/icons";

interface NewHiresFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  unit: string;
  onUnitChange: (value: string) => void;
  unitOptions: string[];
  position: string;
  onPositionChange: (value: string) => void;
  positionOptions: string[];
  startDateFrom: string;
  onStartDateFromChange: (value: string) => void;
  startDateTo: string;
  onStartDateToChange: (value: string) => void;
}

const selectClasses =
  "cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";

// Real since 2026-09-15: search + หน่วยงาน/ตำแหน่งงาน/วันที่เริ่มงาน filter
// the roster client-side (see NewHiresPage's own comment for why
// client-side, not a Core query param). ผู้จัดการ stays decorative — Core
// has no manager data at all (see people/add-person's README).
export function NewHiresFilterBar({
  search,
  onSearchChange,
  unit,
  onUnitChange,
  unitOptions,
  position,
  onPositionChange,
  positionOptions,
  startDateFrom,
  onStartDateFromChange,
  startDateTo,
  onStartDateToChange,
}: NewHiresFilterBarProps) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
          <SearchIcon className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อ, ตำแหน่ง, หน่วยงาน..."
            className="flex-1 bg-transparent text-zinc-700 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200"
          />
        </div>
        <span
          title="Not built yet"
          className="flex h-9 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 dark:border-zinc-700"
        >
          <ListIcon className="h-4 w-4" />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">หน่วยงาน</span>
          <select value={unit} onChange={(e) => onUnitChange(e.target.value)} className={selectClasses}>
            <option value="">ทั้งหมด</option>
            {unitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">ตำแหน่งงาน</span>
          <select value={position} onChange={(e) => onPositionChange(e.target.value)} className={selectClasses}>
            <option value="">ทั้งหมด</option>
            {positionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs text-zinc-400">วันที่เริ่มงาน</span>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDateFrom}
              onChange={(e) => onStartDateFromChange(e.target.value)}
              className={`${selectClasses} min-w-0 flex-1`}
            />
            <span className="text-zinc-400">-</span>
            <input
              type="date"
              value={startDateTo}
              onChange={(e) => onStartDateToChange(e.target.value)}
              className={`${selectClasses} min-w-0 flex-1`}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">ผู้จัดการ</span>
          <span
            title="Core ยังไม่มีข้อมูลผู้บังคับบัญชาต่อคน"
            className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700"
          >
            ทั้งหมด
            <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
          </span>
        </div>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center justify-center gap-1.5 self-end rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          <FilterIcon className="h-3.5 w-3.5" />
          ตัวกรองเพิ่มเติม
        </span>
      </div>
    </Card>
  );
}
