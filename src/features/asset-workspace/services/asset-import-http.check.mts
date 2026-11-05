/** Suite helper. Run: node src/features/asset-workspace/services/asset-import-services.check.mts */
import assert from "node:assert/strict";
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

  await apiFails(() => httpApi.discard(tenantId), "INVALID_STATE", 409);
}
