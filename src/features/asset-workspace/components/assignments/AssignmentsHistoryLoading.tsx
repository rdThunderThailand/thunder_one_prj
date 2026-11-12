import { Skeleton } from "@/components/ui/Skeleton";
import { assignmentHistoryColumns } from "./assignment-history-columns";

export function AssignmentsHistoryLoading() {
  return (
    <div role="status" aria-label="Loading assignment history…" className="relative motion-reduce:[&_*]:animate-none">
      <table aria-hidden="true" className="w-full min-w-6xl table-fixed text-left text-xs">
        <colgroup>
          {assignmentHistoryColumns.map((column) => (
            <col key={column.label} className={column.width} />
          ))}
        </colgroup>
        <thead className="sticky top-0 z-10 bg-muted text-2xs text-muted-foreground">
          <tr>
            {assignmentHistoryColumns.map(({ label: heading }) => (
              <th key={heading} scope="col" className="border-b border-border px-3 py-3 font-medium">
                {heading}{heading === "Date & Time" && <span> ↓</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {[0, 1, 2, 3, 4].map((row) => (
            <tr key={row}>
              {assignmentHistoryColumns.map(({ label: heading }) => (
                <td key={heading} className="px-3 py-3 align-top">
                  <Skeleton className={heading === "#" ? "h-8 w-4" : "h-8 w-full"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
