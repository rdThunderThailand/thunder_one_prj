"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { FilterIcon, GridIcon, ListIcon, SearchIcon } from "@/components/ui/icons";
import type { PersonnelType, WorkStatus } from "../mock-data";

const selectClasses =
  "cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";

const TYPE_LABEL: Record<PersonnelType, string> = {
  employee: "พนักงาน",
  contractor: "ผู้รับเหมา",
  partner: "พันธมิตร",
  guest: "แขก",
  inactive: "พ้นสภาพ/ไม่ใช้งาน",
};
const STATUS_LABEL: Record<WorkStatus, string> = {
  active: "ทำงานอยู่",
  "on-leave": "ลาหยุด",
  invited: "เชิญแล้ว",
  inactive: "พ้นสภาพ",
};

interface PersonnelFilterBarProps {
  unit: string;
  onUnitChange: (value: string) => void;
  unitOptions: string[];
  position: string;
  onPositionChange: (value: string) => void;
  positionOptions: string[];
  type: PersonnelType | "";
  onTypeChange: (value: PersonnelType | "") => void;
  workStatus: WorkStatus | "";
  onWorkStatusChange: (value: WorkStatus | "") => void;
  view: "list" | "grid";
  onViewChange: (view: "list" | "grid") => void;
  onReset: () => void;
}

// Search is real — Core's GET /tenants/:id/members supports `?search=`
// (confirmed 2026-08-28), the only server-side filter it supports. หน่วยงาน/
// ตำแหน่ง/ประเภทบุคลากร/สถานะการทำงาน are real since 2026-09-15, but
// client-side (against the already-fetched roster) — same reasoning as
// new-hires/contractors' own filters. "ทีม" dropped entirely (was in the
// old FILTERS list) — no Core column for it, same gap flagged everywhere
// else "ทีม" comes up in this app.
export function PersonnelFilterBar({
  unit,
  onUnitChange,
  unitOptions,
  position,
  onPositionChange,
  positionOptions,
  type,
  onTypeChange,
  workStatus,
  onWorkStatusChange,
  view,
  onViewChange,
  onReset,
}: PersonnelFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function commitSearch() {
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus-within:border-indigo-500 dark:border-zinc-700">
          <SearchIcon className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitSearch()}
            onBlur={commitSearch}
            placeholder="ค้นหาชื่อ, อีเมล, รหัสพนักงาน, ตำแหน่ง..."
            className="w-full bg-transparent text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => onViewChange("list")}
            title="มุมมองรายการ"
            className={`flex h-7 w-7 items-center justify-center rounded-md ${view === "list" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
          >
            <ListIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("grid")}
            title="มุมมองตาราง"
            className={`flex h-7 w-7 items-center justify-center rounded-md ${view === "grid" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
          >
            <GridIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
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
          <span className="text-xs text-zinc-400">ตำแหน่ง</span>
          <select value={position} onChange={(e) => onPositionChange(e.target.value)} className={selectClasses}>
            <option value="">ทั้งหมด</option>
            {positionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">ประเภทบุคลากร</span>
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value as PersonnelType | "")}
            className={selectClasses}
          >
            <option value="">ทั้งหมด</option>
            {(Object.keys(TYPE_LABEL) as PersonnelType[]).map((option) => (
              <option key={option} value={option}>
                {TYPE_LABEL[option]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">สถานะการทำงาน</span>
          <select
            value={workStatus}
            onChange={(e) => onWorkStatusChange(e.target.value as WorkStatus | "")}
            className={selectClasses}
          >
            <option value="">ทั้งหมด</option>
            {(Object.keys(STATUS_LABEL) as WorkStatus[]).map((option) => (
              <option key={option} value={option}>
                {STATUS_LABEL[option]}
              </option>
            ))}
          </select>
        </div>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          <FilterIcon className="h-3.5 w-3.5" />
          ตัวกรองเพิ่มเติม
        </span>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          รีเซ็ต
        </button>
      </div>
    </Card>
  );
}
