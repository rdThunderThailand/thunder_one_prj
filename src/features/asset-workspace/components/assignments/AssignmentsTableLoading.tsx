import { Skeleton } from "@/components/ui/Skeleton";
import { assignmentTableColumns } from "./assignment-table-columns";

export function AssignmentsTableLoading() {
  return (
    <div role="status" aria-label="Loading assignments" className="motion-reduce:[&_*]:animate-none">
      <table aria-hidden="true" className="w-full min-w-xl table-fixed text-left text-xs">
        <thead className="sticky top-0 z-10 bg-muted text-2xs text-muted-foreground">
          <tr>
            {assignmentTableColumns.map((column) => (
              <th key={column.key} className={`border-b border-border px-4 py-3 font-medium ${column.className}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: 5 }, (_, index) => (
            <tr key={index}>
              {assignmentTableColumns.map((column) => (
                <td key={column.key} className={`px-4 py-2 ${column.className}`}>
                  {column.key === "asset" ? (
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 shrink-0" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : column.key === "custodian" ? (
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-8 shrink-0 rounded-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : (
                    <Skeleton className="h-4 w-full" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
