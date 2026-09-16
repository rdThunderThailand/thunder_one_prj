"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { BoxIcon, ChevronDownIcon, ChevronRightIcon, ClipboardIcon, EditIcon, MoreIcon, StarIcon } from "@/components/ui/icons";
import { ASSET_STATUS_BADGE_COLOR, ASSET_STATUS_LABEL_TH } from "../asset-status-display";
import type { AssetListRow } from "../services/asset-list-api";
import { EditAssetModal } from "./EditAssetModal";

// Print/QR and the "การดำเนินการ" actions menu have no real flow yet — only
// Edit is wired, reusing the same modal AssetRegistryTable opens.
export function AssetDetailHeader({ asset }: { asset: AssetListRow }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {editing && <EditAssetModal asset={asset} onClose={() => setEditing(false)} />}
      <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Link href="/asset-intelligence/assets/all" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          ทรัพย์สินทั้งหมด
        </Link>
        <ChevronRightIcon className="h-3 w-3" />
        <span className="text-zinc-600 dark:text-zinc-300">Asset Detail</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
            <BoxIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {asset.category ?? "Asset"} – {asset.name}
            </h1>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge variant="pill" color={ASSET_STATUS_BADGE_COLOR[asset.status]}>
                {ASSET_STATUS_LABEL_TH[asset.status]}
              </Badge>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{asset.id}</span>
              <button title="Not built yet" className="cursor-not-allowed text-zinc-300 hover:text-zinc-400">
                <ClipboardIcon className="h-3.5 w-3.5" />
              </button>
              <button title="Not built yet" className="cursor-not-allowed text-zinc-300 hover:text-zinc-400">
                <StarIcon className="h-3.5 w-3.5" />
              </button>
              <button title="Not built yet" className="cursor-not-allowed text-zinc-300 hover:text-zinc-400">
                <MoreIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            <ClipboardIcon className="h-4 w-4" />
            พิมพ์ / สร้าง QR
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <EditIcon className="h-4 w-4" />
            แก้ไข
          </button>
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-indigo-300 px-4 py-2.5 text-sm font-medium text-white dark:bg-indigo-500/40"
          >
            การดำเนินการ
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
