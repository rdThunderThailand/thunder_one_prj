import { NewHiresPage } from "@/features/people/new-hires";

// HR Manager — new hires roster + onboarding detail panel ("เข้าใหม่"). The
// roster itself is still mock (people/new-hires/mock-data.ts — no Lifecycle/
// onboarding schema exists in Core yet, confirmed 2026-08-28,
// docs/people/core-response-people-workspace-api.md). The real "add
// employee" creation flow now lives at its own route
// (people/add/employee/page.tsx, people/add-person's AddEmployeeWizardPage)
// — this route no longer needs to fetch tenantId/roles/units itself.
export default function PeopleNewHiresPage() {
  return <NewHiresPage />;
}
