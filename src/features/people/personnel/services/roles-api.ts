// Real Thunder_Core integration for `GET /tenants/:id/roles` — server-only,
// same shape as ./members-api.ts. Added 2026-08-28 answering §8 Q8
// (docs/people/core-response-people-workspace-api.md): `POST
// /tenants/:id/members` requires a `role_code`, and this is how a caller
// finds out which ones are valid for a given tenant — global roles
// (tenant_id null) plus any tenant-scoped ones. Any active tenant member (or
// super_admin) can call it.
import { coreGet } from "@/lib/core/core-get";

export interface CoreRole {
  id: string;
  code: string;
  name: string;
  role_type: string;
  role_scope: string;
  description: string | null;
  is_system: boolean;
}

export async function getRoles(token: string, tenantId: string): Promise<CoreRole[] | null> {
  return coreGet<CoreRole[]>(`/tenants/${tenantId}/roles`, token);
}
