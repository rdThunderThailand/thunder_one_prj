import type { BatchStatus, RowsPage } from "../domain/asset-import-types.ts";

// In the other statuses Core is still adding or changing rows.
const SETTLED: BatchStatus[] = ["validated", "completed", "partially_completed", "failed"];

/** Row pages already shown in this import, so going back to a page or tab does not read it again. */
export function keepImportPages() {
  const pages = new Map<string, RowsPage>();
  return {
    /** The name a page is kept under, or null when pages of this status are not kept. */
    key: (status: BatchStatus | undefined, query: string) => status && SETTLED.includes(status) ? `${status}:${query}` : null,
    get: (key: string | null) => key === null ? undefined : pages.get(key),
    set: (key: string | null, page: RowsPage) => { if (key !== null) pages.set(key, page); },
    clear: () => pages.clear(),
  };
}

export type KeptImportPages = ReturnType<typeof keepImportPages>;
