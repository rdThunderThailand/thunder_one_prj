/** Run: node src/features/asset-workspace/services/asset-import-services.check.mts */
import assert from "node:assert/strict";
import { z } from "zod";
import { autoMap } from "../domain/asset-import-mapping.ts";
import {
  ImportApiError,
  parseImportResponse,
} from "./asset-import-api.ts";
import { createHttpImportApi } from "./asset-import-http.ts";
import { parseImportFile } from "./asset-import-parse.ts";
import {
  buildCsv,
  buildReferenceCsv,
  buildTemplateCsv,
  loadReferenceCsv,
  csvCell,
} from "./asset-import-template.ts";
import {
  getParsedImportFile,
  importSessionKey,
  readImportSession,
  removeImportSession,
  saveImportSession,
  setParsedImportFile,
  setImportNotice,
  takeImportNotice,
} from "./asset-import-session.ts";

import { OPTIONS, CATEGORIES, LOCATIONS, tenantId, userId, context } from "./asset-import-fixtures.check.mts";
import { parserChecks } from "./asset-import-parser.check.mts";
import { httpClientChecks } from "./asset-import-http.check.mts";

const sessionValues = new Map<string, string>();
const storage = (values: Map<string, string>) => ({
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => {
    values.set(key, value);
  },
  removeItem: (key: string) => {
    values.delete(key);
  },
});
const originalSession = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");

function csv(text: string, name = "assets.csv") {
  return new File([text], name, { type: "text/csv" });
}
async function apiFails(operation: () => Promise<unknown>, code: string, status?: number) {
  await assert.rejects(
    operation,
    (error) =>
      error instanceof ImportApiError &&
      error.code === code &&
      (status === undefined || error.status === status),
  );
}

async function referenceChecks() {
  const calls: string[] = [];
  const result = await loadReferenceCsv(context, async (header, kind, query) => {
    assert.equal(header, `${tenantId}:${userId}`);
    calls.push(`${kind}:${query.parentId ?? "root"}:${query.page}`);
    const items = kind === "categories" && !query.parentId
      ? [{ id: tenantId, name: "อุปกรณ์สำนักงาน", code: "OFFICE", is_serial_required: false }]
      : kind === "locations" && !query.parentId
        ? [{ id: userId, name: "HQ", code: "HQ" }]
        : kind === "locations" && query.parentId === userId
          ? [{ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "ชั้น 1", code: null }]
          : [];
    return { items, page: query.page, pageSize: 50, hasMore: false, nextPage: null };
  });
  assert.ok(result.includes("อุปกรณ์สำนักงาน"));
  assert.ok(result.includes("HQ > ชั้น 1"));
  assert.ok(calls.includes(`locations:${userId}:1`));
  await assert.rejects(() => loadReferenceCsv(context, async () => { throw new Error("Unavailable"); }));
}

async function utilityChecks() {
  assert.equal(csvCell('a,"b"'), '"a,""b"""');
  for (const value of ["=1+1", "+1", "-1", "@cmd", "\tcmd", "\rcmd"]) {
    assert.equal(csvCell(value), `"'${value}"`);
  }
  const template = await parseImportFile(
    csv("\uFEFF" + buildTemplateCsv(OPTIONS)),
    OPTIONS,
  );
  assert.equal(template.columnCount, 9);
  assert.equal(
    template.headers.filter((header) => header.endsWith(" *")).length,
    3,
  );
  const reference = buildReferenceCsv(CATEGORIES, LOCATIONS);
  assert.ok(reference.includes("อุปกรณ์สำนักงาน"));
  assert.equal(reference.includes("OLD-FURN"), false);
  assert.ok(buildCsv([["ไทย", "HQ"], ["Desk", "=1+1"]]).includes('"\'=1+1"'));
  const file = await parseImportFile(csv("Name\nDesk"), OPTIONS);
  setParsedImportFile(file);
  assert.equal(getParsedImportFile(), file);
  setParsedImportFile(null);
  assert.equal(getParsedImportFile(), null);
  const batchId = crypto.randomUUID();
  const state = {
    mapping: autoMap(template.headers),
    uploadId: crypto.randomUUID(),
  };
  assert.equal(saveImportSession(batchId, state), true);
  assert.deepEqual(readImportSession(batchId), { state, unavailable: false });
  setImportNotice(`${tenantId}:${userId}`, "Keep Import ID and Source Row.");
  assert.equal(takeImportNotice(`${tenantId}:${userId}`), "Keep Import ID and Source Row.");
  assert.equal(takeImportNotice(`${tenantId}:${userId}`), null, "notices are consumed once");
  setImportNotice(`${tenantId}:${userId}`, "Private batch code");
  assert.equal(takeImportNotice(`${userId}:${tenantId}`), null, "notices do not cross tenant/user context");
  assert.equal(
    sessionValues.get(importSessionKey(batchId))?.includes('"file"'),
    false,
  );
  sessionValues.set(importSessionKey(batchId), "corrupt");
  assert.equal(readImportSession(batchId).state, null);
  assert.equal(removeImportSession(batchId), true);
  assert.throws(
    () => parseImportResponse(z.object({ id: z.uuid() }), { id: "invalid" }),
    ImportApiError,
  );
  await apiFails(
    () => createHttpImportApi(context).getOptions(),
    "IMPORT_UNAVAILABLE",
    503,
  );
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    get() {
      throw new Error("Blocked");
    },
  });
  assert.equal(readImportSession(batchId).unavailable, true);
  assert.equal(saveImportSession(batchId, state), false);
  assert.equal(removeImportSession(batchId), false);
}

try {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: storage(sessionValues),
  });
  await parserChecks();
  await httpClientChecks();
  await referenceChecks();
  await utilityChecks();
  console.log(
    "asset-import-services.check.mts: all parser, HTTP contract, session, and CSV checks passed",
  );
} finally {
  if (originalSession) {
    Object.defineProperty(globalThis, "sessionStorage", originalSession);
  } else {
    Reflect.deleteProperty(globalThis, "sessionStorage");
  }
}
