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
      <nav className="flex items-center gap-1.5 text-xs text-t1-gray-400">
        <Link href="/asset-intelligence/assets/all" className="hover:text-muted-foreground">
          ทรัพย์สินทั้งหมด
        </Link>
        <ChevronRightIcon className="h-3 w-3" />
        <span className="text-muted-foreground">Asset Detail</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <BoxIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {asset.category ?? "Asset"} – {asset.name}
            </h1>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge variant="pill" color={ASSET_STATUS_BADGE_COLOR[asset.status]}>
                {ASSET_STATUS_LABEL_TH[asset.status]}
              </Badge>
              <span className="text-sm text-muted-foreground">{asset.id}</span>
              <button title="Not built yet" className="cursor-not-allowed text-t1-gray-400 hover:text-t1-gray-400">
                <ClipboardIcon className="h-3.5 w-3.5" />
              </button>
              <button title="Not built yet" className="cursor-not-allowed text-t1-gray-400 hover:text-t1-gray-400">
                <StarIcon className="h-3.5 w-3.5" />
              </button>
              <button title="Not built yet" className="cursor-not-allowed text-t1-gray-400 hover:text-t1-gray-400">
                <MoreIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground"
          >
            <ClipboardIcon className="h-4 w-4" />
            พิมพ์ / สร้าง QR
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <EditIcon className="h-4 w-4" />
            แก้ไข
          </button>
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            การดำเนินการ
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
