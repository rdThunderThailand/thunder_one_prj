"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ChevronDownIcon, ChevronRightIcon, InfoIcon, PlusIcon, SearchIcon, UploadIcon } from "@/components/ui/icons";

function Breadcrumb() {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
      <Link href="/asset-intelligence/assets" className="hover:text-zinc-600 dark:hover:text-zinc-300">
        หน้าหลัก
      </Link>
      <ChevronRightIcon className="h-3 w-3" />
      <span>ทรัพย์สิน</span>
      <ChevronRightIcon className="h-3 w-3" />
      <span className="text-zinc-600 dark:text-zinc-300">ทรัพย์สินทั้งหมด</span>
    </nav>
  );
}

export function AllAssetsHeader({ onAddAsset }: { onAddAsset: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <Breadcrumb />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-1.5 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            ทรัพย์สินทั้งหมด
            <InfoIcon className="h-4 w-4 text-zinc-300" />
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">แสดงรายการทรัพย์สินทั้งหมดในองค์กร</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            <UploadIcon className="h-4 w-4 rotate-180" />
            ส่งออก
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </span>
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            <SearchIcon className="h-4 w-4" />
            สแกน QR / Barcode
          </span>
          <Button variant="primary" onClick={onAddAsset}>
            <PlusIcon className="h-4 w-4" />
            เพิ่มทรัพย์สิน
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
