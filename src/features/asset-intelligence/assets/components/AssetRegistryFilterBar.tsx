"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { FilterIcon, SearchIcon } from "@/components/ui/icons";
import { ASSET_STATUS_LABEL_TH } from "../asset-status-display";
import type { AssetFilterOptions } from "../services/asset-list-api";

const ALL = "ทั้งหมด";

function FilterSelect({
  paramKey,
  value,
  options,
  labelFor,
}: {
  paramKey: string;
  value: string;
  options: string[];
  labelFor?: (value: string) => string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === ALL) {
      params.delete(paramKey);
    } else {
      params.set(paramKey, next);
    }
    params.delete("page"); // any filter change restarts pagination at page 1
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
    >
      <option value={ALL}>{ALL}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {labelFor ? labelFor(option) : option}
        </option>
      ))}
    </select>
  );
}

export function AssetRegistryFilterBar({ filters }: { filters: AssetFilterOptions | null }) {
  const searchParams = useSearchParams();

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700">
        <SearchIcon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate" title="Not built yet — Core's /assets/list endpoint has no free-text search param">
          ค้นหา Asset, Serial, ชื่อทรัพย์สิน, ผู้ใช้...
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {filters ? (
          <>
            <FilterSelect paramKey="category" value={searchParams.get("category") ?? ALL} options={filters.category} />
            <FilterSelect
              paramKey="status"
              value={searchParams.get("status") ?? ALL}
              options={[...filters.status]}
              labelFor={(s) => ASSET_STATUS_LABEL_TH[s as keyof typeof ASSET_STATUS_LABEL_TH] ?? s}
            />
            <FilterSelect paramKey="building" value={searchParams.get("building") ?? ALL} options={filters.building} />
            <FilterSelect paramKey="owner" value={searchParams.get("owner") ?? ALL} options={filters.owner} />
          </>
        ) : (
          <span className="col-span-full text-sm text-zinc-400">ไม่สามารถโหลดตัวกรองได้ในขณะนี้</span>
        )}
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          <FilterIcon className="h-3.5 w-3.5" />
          ตัวกรองเพิ่มเติม
        </span>
      </div>
    </Card>
  );
}
