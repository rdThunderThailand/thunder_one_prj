"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EditIcon, EyeIcon, ImageIcon, MoreIcon } from "@/components/ui/icons";
import { ASSET_STATUS_BADGE_COLOR, ASSET_STATUS_LABEL_TH } from "../asset-status-display";
import type { AssetListRow } from "../services/asset-list-api";
import { EditAssetModal } from "./EditAssetModal";

function formatTHB(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatLocation(row: AssetListRow): string {
  const parts = [row.building, row.floor, row.room].filter((p): p is string => Boolean(p));
  return parts.length > 0 ? parts.join(" / ") : "—";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

export function AssetRegistryTable({ rows }: { rows: AssetListRow[] }) {
  const [editingAsset, setEditingAsset] = useState<AssetListRow | null>(null);

  if (rows.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-zinc-400">
        ไม่พบทรัพย์สินตามเงื่อนไขที่เลือก
      </Card>
    );
  }

  return (
    <>
      {editingAsset && <EditAssetModal asset={editingAsset} onClose={() => setEditingAsset(null)} />}
      <Card className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="w-10 px-4 py-3">
              <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
            </th>
            <th className="px-2 py-3 font-medium">รูปภาพ</th>
            <th className="px-4 py-3 font-medium">ชื่อทรัพย์สิน / Serial / Tag</th>
            <th className="px-4 py-3 font-medium">ประเภททรัพย์สิน / หมวดหมู่</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">ผู้ใช้ / ผู้รับผิดชอบ</th>
            <th className="px-4 py-3 font-medium">สถานที่</th>
            <th className="px-4 py-3 font-medium">วันที่รับเข้า</th>
            <th className="px-4 py-3 font-medium">มูลค่า (THB)</th>
            <th className="px-4 py-3 font-medium">การดำเนินการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">
                <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
              </td>
              <td className="px-2 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                  <ImageIcon className="h-4 w-4" />
                </span>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/asset-intelligence/assets/all/${row.id}`}
                  className="font-medium text-zinc-900 hover:text-indigo-600 hover:underline dark:text-zinc-50 dark:hover:text-indigo-400"
                >
                  {row.name}
                </Link>
                <p className="text-xs text-zinc-400">{row.serial ?? "—"}</p>
              </td>
              <td className="px-4 py-3">
                <p className="text-zinc-700 dark:text-zinc-200">{row.category ?? "—"}</p>
                {/* subcategory is always null today — see asset-list-api.ts's header comment */}
                {row.subcategory && <p className="text-xs text-zinc-400">{row.subcategory}</p>}
              </td>
              <td className="px-4 py-3">
                <Badge variant="pill" color={ASSET_STATUS_BADGE_COLOR[row.status]}>
                  {ASSET_STATUS_LABEL_TH[row.status]}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <p className="text-zinc-700 dark:text-zinc-200">{row.owner ?? "—"}</p>
                <p className="text-xs text-zinc-400">{row.department ?? "—"}</p>
              </td>
              <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{formatLocation(row)}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{formatDate(row.receivedDate)}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{formatTHB(row.valueTHB)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Link href={`/asset-intelligence/assets/all/${row.id}`} className="hover:text-zinc-600 dark:hover:text-zinc-300">
                    <EyeIcon className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEditingAsset(row)}
                    className="hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button type="button" title="Not built yet" className="cursor-not-allowed hover:text-zinc-600 dark:hover:text-zinc-300">
                    <MoreIcon className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </Card>
    </>
  );
}
