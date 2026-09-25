import { getAuthToken } from "@/features/auth/services/get-session";
import { LeadApprovalPage } from "@/features/lead-approval";
import { getPartnerApplications } from "@/features/lead-approval/services/partner-applications-api";

// Real Thunder_Core integration since 2026-09-23 — `getPartnerApplications`
// wraps thunder_crm_lineoa.list_partner_applications_for_review, which
// requires the caller to be a super_admin. Anyone else gets `null` back
// (coreGet fails open) and LeadApprovalPage shows an explicit "couldn't
// load" state rather than silently falling back to mock data.
export default async function LeadApprovalRoute() {
  const token = await getAuthToken();
  const applications = token ? await getPartnerApplications(token) : null;

  return <LeadApprovalPage applications={applications} />;
}
