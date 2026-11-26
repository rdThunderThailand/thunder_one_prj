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
  let data: unknown = {
    categories: [
      { code: "OFFICE", name: "อุปกรณ์สำนักงาน", serialRequired: true },
      { code: null, name: "No code", serialRequired: false },
    ],
    locations: [{ code: "HQ", path: "HQ" }, { code: null, path: "HQ > ชั้น 1" }],
  };
  const api = createHttpImportApi(context, async (request) => {
    assert.equal(request.headers["x-registration-context"], `${tenantId}:${userId}`);
    calls.push(`${request.method} ${request.url}`);
    return { status: 200, data: { success: true, data } };
  });
  const result = await loadReferenceCsv(() => api.getReferences());
  assert.deepEqual(result.split("\r\n").slice(1), [
    "Category,OFFICE,อุปกรณ์สำนักงาน,Yes", "Category,,No code,No", "Location,HQ,HQ,", "Location,,HQ > ชั้น 1,",
  ]);
  assert.deepEqual(calls, ["GET /api/proxy/v2/asset-workspace/assets/imports/references"], "one read for the whole list");
  data = { categories: [] };
  await apiFails(() => api.getReferences(), "INVALID_RESPONSE", 502);
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
    mode: "ready_only" as const,
    rowsSent: true,
  };
  assert.equal(saveImportSession(batchId, state), true);
  assert.deepEqual(readImportSession(batchId), { state, unavailable: false });
  const confirming = { ...state, confirmation: { mode: "ready_and_warnings" as const, override_reason: "Approved" } };
  assert.equal(saveImportSession(batchId, confirming), true);
  assert.deepEqual(readImportSession(batchId).state, confirming);
  assert.equal(saveImportSession(batchId, { ...state, confirmation: {} }), true);
  assert.deepEqual(readImportSession(batchId).state?.confirmation, {});
  assert.equal(saveImportSession(batchId, { ...state, confirmation: { override_reason: " " } }), false);
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
