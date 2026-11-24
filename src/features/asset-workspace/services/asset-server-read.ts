// Reads the Assets API from Core while the server renders a page. Server-only.
import type { z } from "zod";
import { env } from "@/config/env";
import { selectedTenantHeader } from "@/lib/core/tenant-selection";

const READ_TIMEOUT_MS = 8000;

/** Every failure is `null`: the browser then loads that part and shows its own message. */
export async function assetServerReader(token: string, tenantId: string) {
  const headers = { "x-api-key": env.coreApiKey ?? "", Authorization: `Bearer ${token}`, ...(await selectedTenantHeader()) };

  return async function read<T>(path: string, schema: z.ZodType<T>): Promise<T | null> {
    try {
      const res = await fetch(`${env.coreApiUrl}/api/core/v2/tenants/${encodeURIComponent(tenantId)}/asset-workspace/assets${path}`, {
        headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(READ_TIMEOUT_MS),
      });
      if (!res.ok) return null;
      const body = await res.json();
      const parsed = schema.safeParse(body?.success === true ? body.data : null);
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  };
}
