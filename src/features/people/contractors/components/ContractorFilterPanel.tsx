import { Card } from "@/components/ui/Card";
import { SearchIcon } from "@/components/ui/icons";

// Fields with genuinely no backing data anywhere in Core's schema (see
// mock-data.ts's header comment) — stay decorative, honestly, not silently
// dropped. "สถานะ" isn't listed here since ContractorTabs already covers it
// with real data.
const INERT_FILTERS = ["บริษัท / ผู้ว่าจ้าง", "ผู้ประสานงานภายใน"];
const INERT_DATE_FILTERS = ["วันที่เริ่มสัญญา", "วันที่สิ้นสุดสัญญา"];

const selectClasses =
  "cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";

interface ContractorFilterPanelProps {
  search: string;
  onSearchChange: (value: string) => void;
  unit: string;
  onUnitChange: (value: string) => void;
  unitOptions: string[];
  onClear: () => void;
}

// A right-side filter panel instead of a per-row detail view — matches the
// mockup's own 4th screen, unlike people/positions' OrgDetailPanel-style
// master/detail. Real since 2026-09-15: ค้นหา + หน่วยงาน filter the fetched
// roster client-side (สถานะ is ContractorTabs' job). บริษัท/ผู้ประสานงานภายใน
// and both date filters stay decorative — no such data exists in Core.
export function ContractorFilterPanel({
  search,
  onSearchChange,
  unit,
  onUnitChange,
  unitOptions,
  onClear,
}: ContractorFilterPanelProps) {
  return (
    <Card className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ตัวกรองด่วน</h3>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">ค้นหา</span>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
          <SearchIcon className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อ, ตำแหน่ง..."
            className="flex-1 bg-transparent text-zinc-700 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200"
          />
        </div>
      </div>

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

      {INERT_FILTERS.map((label) => (
        <div key={label} className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">{label}</span>
          <span
            title="Core ยังไม่มีข้อมูลนี้เก็บไว้"
            className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700"
          >
            ทั้งหมด
          </span>
        </div>
      ))}

      {INERT_DATE_FILTERS.map((label) => (
        <div key={label} className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">{label}</span>
          <span
            title="Core ยังไม่มีข้อมูลนี้เก็บไว้ระดับ list"
            className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700"
          >
            เลือกวันที่
          </span>
        </div>
      ))}

      <div className="mt-2 flex flex-col gap-2">
        <button
          type="button"
          onClick={onClear}
          className="flex items-center justify-center rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          ล้างตัวกรอง
        </button>
      </div>
    </Card>
  );
}
