import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { HISTORY_STATUS, type ImportHistory } from "../../domain/asset-import-history";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Bangkok" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok" });

export function ImportHistoryTable({ data, onView }: { data: ImportHistory; onView: () => void }) {
  return (
    <div className="overflow-x-auto rounded-control border border-border">
      <table className="w-full text-left text-xs">
        <caption className="sr-only">Finished bulk imports. Times use Asia/Bangkok.</caption>
        <thead className="bg-muted text-foreground">
          <tr>
            {["Import ID", "File Name", "Imported At", "Status", "Result"].map((title) => <th key={title} scope="col" className="px-3 py-3 font-medium">{title}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.batches.map((batch) => {
            const date = new Date(batch.createdAt);
            const status = HISTORY_STATUS[batch.status];
            return (
              <tr key={batch.id} className="border-t border-border align-top">
                <td className="px-3 py-3 font-medium wrap-anywhere">{batch.batchCode}</td>
                <td className="max-w-48 px-3 py-3 wrap-anywhere">{batch.fileName ?? "—"}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <time dateTime={batch.createdAt} title={`${dateFormat.format(date)} ${timeFormat.format(date)} Asia/Bangkok`}>
                    {dateFormat.format(date)}
                  </time>
                </td>
                <td className="px-3 py-3">
                  <Badge variant="pill" color={status.tone}>{status.label}</Badge>
                </td>
                <td className="px-3 py-3">
                  <Link href={`/asset-workspace/assets/import?batch=${encodeURIComponent(batch.id)}`} onClick={onView}
                    aria-label={`View results for ${batch.batchCode}`} className="inline-flex min-h-8 items-center rounded-control text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
