import Link from "next/link";
import type { AssetListRow } from "../../services/assets-list-types";
import { AssetsConditionValue, AssetsStatusValue } from "../assets-list/AssetsRowDetails";

export function CategoryAssetsTable({ rows }: { rows: AssetListRow[] }) {
  const cell = "border-b border-border px-3 py-3 align-top break-words";
  const secondary = "hidden @min-4xl/assets-results:table-cell";
  return (
    <table className="w-full min-w-96 table-fixed border-separate border-spacing-0 text-left text-xs leading-relaxed">
      <caption className="sr-only">Read-only assets in this category and its descendants.</caption>
      <thead data-category-controls className="sticky top-0 z-10 bg-muted text-muted-foreground [&_th]:h-10 [&_th]:border-y [&_th]:border-border [&_th]:px-3 [&_th]:font-semibold">
        <tr>
          <th scope="col">Asset</th>
          <th scope="col" className="w-28 @min-4xl/assets-results:w-[15%]">Asset Tag</th>
          <th scope="col" className={`${secondary} w-[17%]`}>Location</th>
          <th scope="col" className={`${secondary} w-[16%]`}>Custody</th>
          <th scope="col" className="w-28 @min-4xl/assets-results:w-[14%]">Status</th>
          <th scope="col" className={`${secondary} w-[12%]`}>Condition</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-muted/60 focus-within:bg-muted/60">
            <td className={cell}>
              <Link href={`/asset-workspace/assets/${encodeURIComponent(row.id)}`}
                className="inline-block min-h-8 rounded-xs py-1 font-semibold text-accent-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                {row.name}
              </Link>
              <dl className="mt-1 space-y-1 text-muted-foreground @min-4xl/assets-results:hidden">
                <div>
                  <dt className="inline">Location: </dt>
                  <dd className="inline">{row.location_name || "—"}</dd>
                </div>
                <div>
                  <dt className="inline">Custody: </dt>
                  <dd className="inline">{row.custody?.name || "—"}</dd>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <dt>Condition:</dt>
                  <dd><AssetsConditionValue value={row.condition} /></dd>
                </div>
              </dl>
            </td>
            <td className={`${cell} tabular-nums`}>{row.asset_code}</td>
            <td className={`${cell} ${secondary}`}>{row.location_name || "—"}</td>
            <td className={`${cell} ${secondary}`}>{row.custody?.name || "—"}</td>
            <td className={cell}><AssetsStatusValue value={row.status} /></td>
            <td className={`${cell} ${secondary}`}><AssetsConditionValue value={row.condition} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
