import { mapCoreOrgTree } from "@/features/people/org-structure/core-mapper";
import { getOrganizations } from "@/features/people/org-structure/services/organizations-api";
import { AddBulkWizardPage } from "@/features/people/add-person";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

// HR Manager — "เพิ่มหลายคนเข้าองค์กร (Bulk)" full-page flow. Fully
// mock/demo (see AddBulkWizardPage's own header comment for why) — no
// role_code/tenantId needed since it never calls Core, only the real
// org-unit tree for the หน่วยงาน dropdown's options.
export default async function PeopleAddBulkPage() {
  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  if (!token || !tenantId) {
    return <AddBulkWizardPage units={null} />;
  }

  const orgTree = await getOrganizations(token, tenantId);
  const units = orgTree ? mapCoreOrgTree(orgTree, []).units : null;

  return <AddBulkWizardPage units={units} />;
}
