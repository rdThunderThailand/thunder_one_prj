import { getDraftPublications, getPartnerApplications, getRoster } from "./services/work-sources-api";
import { buildMyWork, EMPTY_MY_WORK, type MyWork, type WorkScope } from "./work-items";

/**
 * The one server-side entry point for "what needs this user" — used by the
 * My Work page, the Topbar bell (/api/notifications) and Mission Control's
 * "งานที่ต้องดำเนินการ" card, so all three always show the same items.
 * Missing token/tenant → everything unavailable, never a thrown error.
 */
export async function loadMyWork(
  token: string | null,
  tenantId: string | null,
  userId: string | null,
  scope: WorkScope
): Promise<MyWork> {
  if (!token || !tenantId) return EMPTY_MY_WORK;
  const [partnerApplications, roster, drafts] = await Promise.all([
    getPartnerApplications(token),
    scope === "admin" ? getRoster(token, tenantId) : Promise.resolve(null),
    getDraftPublications(token),
  ]);
  return buildMyWork({ partnerApplications, roster, drafts }, userId, scope);
}
