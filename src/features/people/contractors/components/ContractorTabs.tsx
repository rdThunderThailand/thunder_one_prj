import type { ContractorRow, ContractorTab } from "../mock-data";

const TAB_DEFS: { id: ContractorTab["id"]; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "active", label: "กำลังปฏิบัติงาน" },
  { id: "expiring-soon", label: "ใกล้หมดสัญญา" },
  { id: "expired", label: "สิ้นสุดแล้ว" },
  { id: "pending-approval", label: "รออนุมัติ" },
];

interface ContractorTabsProps {
  active: ContractorTab["id"];
  onChange: (id: ContractorTab["id"]) => void;
  /** Real since 2026-09-15 — tab counts computed from the fetched roster
   *  instead of the mockup's own static header numbers. */
  rows: ContractorRow[];
}

// Real, client-side filtering of the fetched roster by status — same
// pattern as people/personnel's PersonnelTabs.
export function ContractorTabs({ active, onChange, rows }: ContractorTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {TAB_DEFS.map((tab) => {
        const count = tab.id === "all" ? rows.length : rows.filter((r) => r.status === tab.id).length;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
              active === tab.id
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                active === tab.id
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
