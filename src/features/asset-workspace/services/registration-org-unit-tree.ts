import { z } from "zod";
import { flattenOrganizationTree, type OrganizationTreeRow } from "../domain/registration-reference-tree.ts";

const organization: z.ZodType<OrganizationTreeRow> = z.lazy(() => z.object({
  id: z.guid(),
  name: z.string().nullable(),
  code: z.string().nullable(),
  parent_department_id: z.guid().nullable(),
  department_type: z.string().nullable(),
  status: z.string(),
  children: z.array(organization),
}));

const envelope = z.object({ success: z.literal(true), data: z.array(organization) });

/** The existing v1 proxy forwards the session cookie. Core checks membership for this tenant. */
export async function getRegistrationOrgUnits(context: string, signal: AbortSignal, request: typeof fetch = fetch) {
  const tenant = z.guid().safeParse(context.split(":")[0]);
  if (!tenant.success) return null;

  try {
    const response = await request(`/api/proxy/tenants/${tenant.data}/organizations`, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "x-registration-context": context },
      signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
    });
    if (!response.ok) return null;
    const parsed = envelope.safeParse(await response.json());
    return parsed.success ? flattenOrganizationTree(parsed.data.data) : null;
  } catch {
    return null;
  }
}
