"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  BoxIcon,
  BuildingIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GlobeIcon,
  GridIcon,
  MoreIcon,
  SettingsIcon,
} from "@/components/ui/icons";
import {
  locationPageSize,
  locationTotalCount,
  locationTotalPages,
  locationTree,
  type LocationNode,
  type LocationNodeType,
} from "../mock-data";

const iconFor: Record<LocationNodeType, React.ReactNode> = {
  "Head Office": <GlobeIcon className="h-3.5 w-3.5" />,
  Building: <BuildingIcon className="h-3.5 w-3.5" />,
  Floor: <GridIcon className="h-3.5 w-3.5" />,
  Room: <BoxIcon className="h-3.5 w-3.5" />,
  Warehouse: <BoxIcon className="h-3.5 w-3.5" />,
  "Branch Office": <BuildingIcon className="h-3.5 w-3.5" />,
  Factory: <SettingsIcon className="h-3.5 w-3.5" />,
};

// Matches the mockup's initial expand state — HQ, Building A, and Floor 3
// open, everything else collapsed.
const DEFAULT_EXPANDED = new Set(["loc-hq", "loc-building-a", "loc-floor-a3"]);

function formatTHB(value: number): string {
  return value.toLocaleString("en-US");
}

function LocationTreeRow({ node, depth }: { node: LocationNode; depth: number }) {
  const [expanded, setExpanded] = useState(DEFAULT_EXPANDED.has(node.id));
  const hasChildren = !!node.children?.length;

  return (
    <>
      <tr>
        <td className="px-4 py-2.5">
          <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
        </td>
        <td className="px-2 py-2.5">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex h-5 w-5 shrink-0 items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <ChevronRightIcon className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {iconFor[node.type]}
            </span>
            <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{node.name}</span>
            {node.badge && (
              <Badge variant="pill" color="indigo" className="shrink-0">
                {node.badge}
              </Badge>
            )}
          </div>
        </td>
        <td className="px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">{node.type}</td>
        <td className="px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">{node.code}</td>
        <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-300">{node.assetCount.toLocaleString()}</td>
        <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-300">{formatTHB(node.valueTHB)}</td>
        <td className="px-4 py-2.5">
          <Badge variant="pill" color="green">
            {node.status}
          </Badge>
        </td>
        <td className="px-4 py-2.5">
          <button type="button" title="Not built yet" className="cursor-not-allowed text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            <MoreIcon className="h-4 w-4" />
          </button>
        </td>
      </tr>
      {expanded &&
        node.children?.map((child) => <LocationTreeRow key={child.id} node={child} depth={depth + 1} />)}
      {expanded && node.moreLabel && (
        <tr>
          <td />
          <td className="px-2 py-1.5" style={{ paddingLeft: (depth + 2) * 20 + 8 }} colSpan={7}>
            <span title="Not built yet" className="cursor-not-allowed text-xs font-medium text-indigo-600 dark:text-indigo-400">
              {node.moreLabel}
            </span>
          </td>
        </tr>
      )}
    </>
  );
}

export function LocationTree() {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
              </th>
              <th className="px-2 py-3 font-medium">ชื่อสถานที่ / อาคาร / ชั้น / ห้อง</th>
              <th className="px-4 py-3 font-medium">ประเภท</th>
              <th className="px-4 py-3 font-medium">รหัส</th>
              <th className="px-4 py-3 font-medium">จำนวนสินทรัพย์</th>
              <th className="px-4 py-3 font-medium">มูลค่าสินทรัพย์ (THB)</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {locationTree.map((node) => (
              <LocationTreeRow key={node.id} node={node} depth={0} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400"
        >
          แสดง
          <span className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 dark:border-zinc-700">
            {locationPageSize}
            <ChevronDownIcon className="h-3 w-3" />
          </span>
          รายการ
        </span>
        <span className="text-sm text-zinc-400">
          1-{locationTree.length} จาก {locationTotalCount.toLocaleString()} รายการ
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-zinc-300 dark:border-zinc-700"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          {Array.from({ length: locationTotalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              title="Not built yet"
              className={`flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg text-sm ${
                page === 1
                  ? "bg-indigo-600 text-white"
                  : "border border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-zinc-300 dark:border-zinc-700"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
