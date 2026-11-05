import type { ImportOptions } from "../domain/asset-import-types.ts";
import type { AssetImportContext } from "./asset-import-api.ts";
import type {
  SelectorKind,
  SelectorPage,
} from "./registration-selector-contract.ts";

export type ReferenceCategoryRow = {
  code: string;
  name: string;
  serialRequired: boolean;
  active: boolean;
};

export type ReferenceLocationRow = {
  code: string | null;
  path: string;
};

export type ImportReferences = {
  categories: ReferenceCategoryRow[];
  locations: ReferenceLocationRow[];
};

export function csvCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const formulaSafe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\r\n]/.test(formulaSafe) || formulaSafe.startsWith("'")) {
    return `"${formulaSafe.replace(/"/g, '""')}"`;
  }
  return formulaSafe;
}

export function buildCsv(rows: unknown[][]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function buildTemplateCsv(options: ImportOptions): string {
  return buildCsv(templateRows(options));
}

export function templateRows(options: ImportOptions): string[][] {
  const headers = options.columns.map((column) =>
    column.required ? `${column.label} *` : column.label,
  );
  const exampleRow = options.columns.map((column) => column.example);
  return [headers, exampleRow];
}

export function buildReferenceCsv(
  categories: ReferenceCategoryRow[],
  locations: ReferenceLocationRow[],
): string {
  const rows: unknown[][] = [
    ["Type", "Code", "Name / Full Path", "Serial Required"],
    ...categories
      .filter((category) => category.active)
      .map((category) => [
        "Category",
        category.code,
        category.name,
        category.serialRequired ? "Yes" : "No",
      ]),
    ...locations.map((location) => ["Location", location.code ?? "", location.path, ""]),
  ];
  return buildCsv(rows);
}

export type ReferencePageFetcher = (
  context: string,
  kind: SelectorKind,
  query: { parentId?: string | null; page: number; pageSize: number },
) => Promise<SelectorPage>;

const defaultReferenceFetcher: ReferencePageFetcher = async (context, kind, query) => {
  const { fetchRegistrationReferences } = await import("./registration-selector-client.ts");
  return fetchRegistrationReferences(context, {
    kind,
    page: query.page,
    page_size: query.pageSize,
    ...(query.parentId ? { parent_id: query.parentId } : {}),
  });
};

const MAX_TOTAL_REQUESTS = 200;

async function collectHierarchy(
  contextHeader: string,
  kind: "categories" | "locations",
  fetcher: ReferencePageFetcher,
): Promise<{
  id: string;
  code: string | null;
  name: string;
  path: string;
  serialRequired: boolean;
}[]> {
  const results: {
    id: string;
    code: string | null;
    name: string;
    path: string;
    serialRequired: boolean;
  }[] = [];
  const queue: { parentId: string | null; parentPath: string }[] = [
    { parentId: null, parentPath: "" },
  ];
  const visitedParents = new Set<string | null>();
  let totalRequests = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visitedParents.has(current.parentId)) continue;
    visitedParents.add(current.parentId);

    for (let page = 1; ; page += 1) {
      if (totalRequests >= MAX_TOTAL_REQUESTS) {
        throw new Error("The reference list could not be loaded in full.");
      }
      totalRequests += 1;
      const response = await fetcher(contextHeader, kind, {
        parentId: current.parentId,
        page,
        pageSize: 50,
      });
      for (const item of response.items) {
        const itemName = item.name?.trim() || "Unnamed";
        const fullPath = current.parentPath ? `${current.parentPath} > ${itemName}` : itemName;
        results.push({
          id: item.id,
          code: item.code ?? null,
          name: itemName,
          path: fullPath,
          serialRequired: Boolean(item.is_serial_required),
        });
        queue.push({ parentId: item.id, parentPath: fullPath });
      }
      if (!response.hasMore) break;
    }
  }
  return results;
}

export async function loadImportReferences(
  context: AssetImportContext,
  fetcher: ReferencePageFetcher = defaultReferenceFetcher,
): Promise<ImportReferences> {
  const contextHeader = `${context.tenantId}:${context.userId}`;
  const [categories, locations] = await Promise.all([
    collectHierarchy(contextHeader, "categories", fetcher),
    collectHierarchy(contextHeader, "locations", fetcher),
  ]);
  return {
    categories: categories.map((category) => ({
      code: category.code ?? "",
      name: category.name,
      serialRequired: category.serialRequired,
      active: true,
    })),
    locations: locations.map((location) => ({
      code: location.code,
      path: location.path,
    })),
  };
}

export async function loadReferenceCsv(
  context: AssetImportContext,
  fetcher: ReferencePageFetcher = defaultReferenceFetcher,
): Promise<string> {
  const { categories, locations } = await loadImportReferences(context, fetcher);
  return buildReferenceCsv(categories, locations);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
