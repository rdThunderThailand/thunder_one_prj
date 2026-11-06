/** Suite helper. Run: node src/features/asset-workspace/services/asset-import-services.check.mts */
import assert from "node:assert/strict";
import { importRowSchema } from "./asset-import-contract.ts";
import { ImportApiError } from "./asset-import-api.ts";
import { createHttpImportApi } from "./asset-import-http.ts";
import { OPTIONS, tenantId, userId, context } from "./asset-import-fixtures.check.mts";

async function apiFails(operation: () => Promise<unknown>, code: string, status?: number) {
  await assert.rejects(
    operation,
    (error) =>
      error instanceof ImportApiError &&
      error.code === code &&
      (status === undefined || error.status === status),
  );
}

export async function httpClientChecks() {
  const calls: { method: string; url: string; headers: Record<string, string> }[] =
    [];
  const httpApi = createHttpImportApi(context, async (req) => {
    calls.push({ method: req.method, url: req.url, headers: req.headers });
    if (req.url.endsWith("/imports/options")) {
      return { status: 200, data: { success: true, data: OPTIONS } };
    }
    if (req.url.endsWith("/imports") && req.method === "POST") {
      return {
        status: 200,
        data: {
          success: true,
          data: {
            batchId: tenantId,
            batchCode: "IMP-20261104-0001",
            status: "uploaded",
            totalRows: 10,
            rowsPerRequest: 1000,
            replayed: false,
          },
        },
      };
    }
    if (req.url.endsWith("/validate")) {
      return {
        status: 502,
        data: { code: "UPSTREAM_FAILED", error: "The asset service could not be reached." },
      };
    }
    if (req.url.endsWith("/result-file")) {
      return { status: 200, data: "Asset Name\r\nจอ" };
    }
    if (req.url.endsWith("/error-file")) {
      return {
        status: 200,
        data: new Blob(["\uFEFFAsset Name\r\nDesk"]),
        headers: {
          "content-disposition": 'attachment; filename="IMP-20261104-0001-errors.csv"',
        },
      };
    }
    return {
      status: 409,
      data: { error: { code: "CONFLICT", message: "Conflict" } },
    };
  });

  const options = await httpApi.getOptions();
  assert.equal(options.columns.length, 9);
  assert.equal(calls[0].headers["x-registration-context"], `${tenantId}:${userId}`);

  const created = await httpApi.createBatch({
    batchId: tenantId,
    sourceUploadId: userId,
    totalRows: 10,
  });
  assert.equal(created.batchCode, "IMP-20261104-0001");

  const downloaded = await httpApi.downloadFile(tenantId, "error", "IMP-20261104-0001");
  assert.equal(downloaded.filename, "IMP-20261104-0001-errors.csv");
  const startsWithBom = async (blob: Blob) => {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf && bytes[3] !== 0xef;
  };
  assert.ok(await startsWithBom(downloaded.blob), "Core's BOM is kept once");

  // The proxy strips the BOM and the filename header.
  const proxied = await httpApi.downloadFile(tenantId, "result", "IMP-20261104-0001");
  assert.equal(proxied.filename, "IMP-20261104-0001-result.csv");
  assert.ok(await startsWithBom(proxied.blob), "BOM is restored for Excel");

  await apiFails(() => httpApi.validate(tenantId), "CONNECTION_FAILED", 502);

  assert.ok(
    importRowSchema.safeParse({
      id: tenantId,
      rowIndex: 2,
      values: { name: "Desk" },
      severity: "warning",
      messages: [],
      result: "created_with_warning",
      createdAsset: null,
      override: { reason: "Approved", by: null, at: "2026-11-04T00:00:00.000Z" },
      originalRowIndex: null,
    }).success,
    "an override whose approver was removed still parses",
  );

  await apiFails(() => httpApi.discard(tenantId), "INVALID_STATE", 409);
}

