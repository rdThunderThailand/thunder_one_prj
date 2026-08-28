"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ChevronDownIcon, FilterIcon, ListIcon, SearchIcon } from "@/components/ui/icons";

const FILTERS = ["สถานะ", "หน่วยงาน", "ทีม", "ประเภทบุคลากร", "สถานะการทำงาน"];

function FilterSelect({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-zinc-400">{label}</span>
      <span
        title="Not built yet — Core has no server-side filter for this field"
        className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
      >
        ทั้งหมด
        <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
      </span>
    </div>
  );
}

// Search is real — Core's GET /tenants/:id/members supports `?search=`
// (confirmed 2026-08-28, docs/people/core-response-people-workspace-api.md),
// the only filter it supports today. Pushed on Enter/blur, not per
// keystroke, to avoid a server round-trip on every character. Every other
// dropdown here stays decorative until Core adds a matching query param —
// same convention as people/personnel's PersonnelFilterBar always had.
export function PersonnelFilterBar() {
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
        <span
          title="Not built yet"
          className="flex h-9 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 dark:border-zinc-700"
        >
          <ListIcon className="h-4 w-4" />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {FILTERS.map((label) => (
          <FilterSelect key={label} label={label} />
        ))}
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
