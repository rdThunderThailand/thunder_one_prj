import { z } from "zod";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import { ImportApiError, type AssetImportContext } from "./asset-import-api.ts";

const successEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
});

const coreFailureSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

const proxyFailureSchema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
});

export type ImportHttpResponse = {
  status: number;
  data: unknown;
  headers?: Record<string, string | undefined>;
};

export type ImportHttpRequester = (config: {
  url: string;
  method: "GET" | "POST" | "DELETE";
  headers: Record<string, string>;
  data?: unknown;
  responseType?: "json" | "blob";
}) => Promise<ImportHttpResponse>;

export const defaultRequester: ImportHttpRequester = async (config) => {
  if (typeof window === "undefined") {
    throw new ImportApiError("IMPORT_UNAVAILABLE", requestErrorText("IMPORT_UNAVAILABLE", 503), 503);
  }
  const { apiClient } = await import("@/lib/api/client");
  const response = await apiClient.request<unknown>({
    url: config.url,
    baseURL: "",
    method: config.method,
    headers: config.headers,
    data: config.data,
    responseType: config.responseType ?? "json",
    timeout: config.method === "GET" ? 15000 : 60000,
    validateStatus: () => true,
  });
  const headers: Record<string, string | undefined> = {};
  if (response.headers && typeof response.headers === "object") {
    for (const [key, value] of Object.entries(response.headers)) {
      if (typeof value === "string") headers[key.toLowerCase()] = value;
    }
  }
  return { status: response.status, data: response.data, headers };
};

export function unwrapEnvelope(response: ImportHttpResponse): unknown {
  const coreError = coreFailureSchema.safeParse(response.data);
  const proxyError = proxyFailureSchema.safeParse(response.data);

  if (
    response.status < 200 ||
    response.status >= 300 ||
    coreError.success ||
    (proxyError.success && Boolean(proxyError.data.error))
  ) {
    const rawCode = coreError.success
      ? coreError.data.error.code
      : proxyError.success
        ? (proxyError.data.code ?? "REQUEST_FAILED")
        : "INVALID_RESPONSE";
    const code =
      rawCode === "CONFLICT"
        ? "INVALID_STATE"
        : rawCode === "UPSTREAM_FAILED"
          ? "CONNECTION_FAILED"
          : rawCode;
    const details = coreError.success ? coreError.data.error.details : undefined;
    throw new ImportApiError(
      code,
      requestErrorText(code, response.status),
      response.status,
      details,
    );
  }

  const parsedEnvelope = successEnvelopeSchema.safeParse(response.data);
  if (!parsedEnvelope.success) {
    throw new ImportApiError("INVALID_RESPONSE", requestErrorText("INVALID_RESPONSE", 502), 502);
  }
  return parsedEnvelope.data.data;
}

export type ImportJsonCaller = (
  method: "GET" | "POST" | "DELETE", path: string, data?: unknown,
) => Promise<unknown>;

/** All JSON endpoints retain the same context header, envelope and safe errors. */
export function createImportJsonCaller(
  context: AssetImportContext,
  requester: ImportHttpRequester = defaultRequester,
): ImportJsonCaller {
  const baseHeaders = () => ({
    "x-registration-context": `${context.tenantId}:${context.userId}`,
  });

  async function callJson(
    method: "GET" | "POST" | "DELETE",
    path: string,
    data?: unknown,
  ): Promise<unknown> {
    let response: ImportHttpResponse;
    try {
      response = await requester({
        url: `/api/proxy/v2/asset-workspace/assets${path}`,
        method,
        headers: baseHeaders(),
        data,
      });
    } catch (error) {
      if (error instanceof ImportApiError) throw error;
      throw new ImportApiError("CONNECTION_FAILED", requestErrorText("CONNECTION_FAILED"), 0);
    }
    return unwrapEnvelope(response);
  }

  return callJson;
}
