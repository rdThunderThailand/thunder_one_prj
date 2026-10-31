import "server-only";
import { z } from "zod";
import { env } from "@/config/env";
import { registrationOptionsSchema, type RegistrationReadResult } from "./asset-registration-contract";

export async function getRegistrationOptions(context: { tenantId: string; token: string }): Promise<RegistrationReadResult> {
  if (!env.coreApiUrl || !env.coreApiKey) {
    return { ok: false, status: 503, message: "The asset service is not configured. Contact your administrator." };
  }
  try {
    const base = `${env.coreApiUrl}/api/core/v2/tenants/${encodeURIComponent(context.tenantId)}/asset-workspace/assets`;
    const response = await fetch(`${base}/registration-options`, {
      headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${context.token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const message = response.status === 401 ? "Sign in again to prepare an asset registration."
        : response.status === 403 ? "You don't have permission to register assets in this organization."
          : "Registration options couldn't be loaded. Try again.";
      return { ok: false, status: response.status, message };
    }
    const body: unknown = await response.json();
    const parsed = z.object({ success: z.literal(true), data: registrationOptionsSchema }).safeParse(body);
    if (!parsed.success && process.env.NODE_ENV !== "production") {
      // Field paths and issue codes diagnose contract drift without logging records or credentials.
      console.warn("[asset-registration] Invalid registration options", JSON.stringify(parsed.error.issues.map((issue) => ({
        path: issue.path.join("."), code: issue.code,
      }))));
    }
    return parsed.success ? { ok: true, data: parsed.data.data }
      : { ok: false, status: 502, message: "The asset service returned unexpected registration options. Try again." };
  } catch {
    return { ok: false, status: 503, message: "The asset service is unavailable. Check your connection and retry." };
  }
}
