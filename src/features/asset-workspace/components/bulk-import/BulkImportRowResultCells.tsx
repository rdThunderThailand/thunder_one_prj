import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import type { ImportRow } from "../../domain/asset-import-types";
import { RowIssue } from "./BulkImportRowCells";

export function BulkImportRowResultCells({ row, onViewRow }: { row: ImportRow; onViewRow: (row: ImportRow) => void }) {
  return (
    <>
                  <td className="wrap-anywhere p-2">
                    {row.createdAsset ? (
                      <Link
                        href={`/asset-workspace/assets/${row.createdAsset.id}`}
                        className="inline-flex min-h-8 items-center text-primary underline-offset-4 hover:underline"
                      >
                        {row.createdAsset.assetTag}
                      </Link>
                    ) : row.values.asset_tag ? (
                      <span>{row.values.asset_tag}</span>
                    ) : null}
                    {/* No tag (row not created): the serial stands alone instead of under a "–". */}
                    {row.createdAsset || row.values.asset_tag ? (
                      <span className="block text-2xs text-muted-foreground">
                        {row.values.serial_number || "–"}
                      </span>
                    ) : (
                      <span>{row.values.serial_number || "–"}</span>
                    )}
                  </td>
                  <td className="wrap-anywhere p-2">
                    {row.values.category || "–"}
                  </td>
                  <td className="wrap-anywhere p-2">
                    {row.values.location || "–"}
                  </td>
                  <td className="wrap-anywhere p-2">
                    <RowIssue row={row} result />
                  </td>
                  <td className="p-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewRow(row)}
                    >
                      View Row
                    </Button>
                  </td>
    </>
  );
}
