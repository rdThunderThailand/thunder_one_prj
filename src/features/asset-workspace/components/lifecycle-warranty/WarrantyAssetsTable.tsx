"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ClockIcon, EditIcon, EyeIcon, PlusIcon } from "@/components/ui/icons";
import { warrantyRowMenu } from "../../domain/warranty-list";
import { WARRANTY_TONE } from "../../domain/status-tone";
import { warrantyEndHint, warrantyNotStarted } from "../../domain/warranty-timing";
import { todayInBangkok } from "../asset-profile/ProfileParts";
import type { WarrantyListRow } from "../../services/warranty-workspace-api";
import { LwRowMenu } from "./LwRowMenu";
import { WARRANTY_COLUMNS } from "./lw-columns";

const MENU_ICONS = { view: EyeIcon, add: PlusIcon, edit: EditIcon, history: ClockIcon };

const day = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date) : value;
};

export function WarrantyAssetsTable({ rows }: { rows: WarrantyListRow[] }) {
  const router = useRouter();
  const today = todayInBangkok();
  return (
    <table className="w-full min-w-2xl table-fixed text-left text-xs">
      <caption className="sr-only">Assets with their current warranty. Select a row to open the asset.</caption>
      <thead className="sticky top-0 z-10 bg-muted text-2xs text-muted-foreground">
        <tr>
          {WARRANTY_COLUMNS.map((column) => (
            <th key={column.key} scope="col" className={`border-b border-border px-3 py-3 font-semibold first:pl-4 last:pr-4 ${column.className}`}>
              {column.key === "menu" ? <span className="sr-only">{column.label}</span> : column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((row) => {
          const href = `/asset-workspace/assets/${encodeURIComponent(row.assetId)}`;
          return (
            <tr
              key={row.assetId}
              className="cursor-pointer transition-colors duration-150 hover:bg-muted/50 motion-reduce:transition-none"
              onClick={(event) => {
                const target = event.target as Element;
                if (target.closest("a, button, [role=menu]") || window.getSelection()?.toString()) return;
                router.push(href);
              }}
            >
              <td className="py-3 pr-3 pl-4 align-middle">
                <Link href={href} className="block rounded-control font-semibold text-foreground underline-offset-4 wrap-anywhere hover:text-accent-foreground hover:underline">
                  {row.name || "Unnamed asset"}
                </Link>
                <p className="text-2xs text-muted-foreground wrap-anywhere @4xl/lw:hidden">{row.warrantyType ?? "—"}</p>
              </td>
              <td className="px-3 py-3 align-middle tabular-nums wrap-anywhere text-muted-foreground">{row.assetTag || "Not available"}</td>
              <td className="px-3 py-3 align-middle wrap-anywhere text-muted-foreground">{row.provider ?? "—"}</td>
              <td className="hidden px-3 py-3 align-middle wrap-anywhere text-muted-foreground @4xl/lw:table-cell">{row.warrantyType ?? "—"}</td>
              <td className="hidden px-3 py-3 align-middle tabular-nums text-muted-foreground @5xl/lw:table-cell">{day(row.startDate)}</td>
              <td className="px-3 py-3 align-middle tabular-nums text-muted-foreground">
                {day(row.endDate)}
                {warrantyEndHint(row.status, row.endDate, today) && (
                  <p className="text-2xs">{warrantyEndHint(row.status, row.endDate, today)}</p>
                )}
              </td>
              <td className="px-3 py-3 align-middle">
                <Badge color={WARRANTY_TONE[row.status] ?? "zinc"} variant="pill">{row.status}</Badge>
                {row.status === "Active" && warrantyNotStarted(row.startDate, today) && (
                  <p className="mt-1 text-2xs text-muted-foreground">Starts {day(row.startDate)}</p>
                )}
              </td>
              <td className="relative py-2 pr-4 pl-3 align-middle">
                <div className="flex justify-end">
                  <LwRowMenu name={row.name || "Unnamed asset"} items={warrantyRowMenu(row)} icons={MENU_ICONS} />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
