import { z } from "zod";

const locationRow = z.object({
  id: z.guid(), name: z.string().nullable(), parentId: z.guid().nullable(),
  status: z.string(), locationType: z.string().nullable().optional(),
});
const envelope = z.object({ success: z.literal(true), data: z.array(locationRow) });

/** Member locations list (the route FE 08/09 read) with status and type, for the registration location picker. */
export async function getRegistrationLocations(context: string, signal: AbortSignal, request: typeof fetch = fetch) {
  try {
    const response = await request("/api/proxy/v2/asset-workspace/locations", {
      method: "GET", credentials: "same-origin", cache: "no-store",
      headers: { "x-registration-context": context },
      signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
    });
    const parsed = envelope.safeParse(await response.json().catch(() => null));
    return response.ok && parsed.success ? { ok: true as const, data: parsed.data.data } : { ok: false as const };
  } catch (error) {
    if (signal.aborted) throw error;
    return { ok: false as const };
  }
}
