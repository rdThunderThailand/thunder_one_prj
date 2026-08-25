# governance

The department_admin / manager_it_asset ("manager") variant of the shell's shared Governance page (landing page at `/governance`) — `config/rbac.ts`'s `resolveShellVariant`. No CEO variant exists yet; every other role still sees the route's original "Not built yet" stub.

> R&D placeholder — mock data matching the reference mockup exactly, no backend yet.

- `components/` —
  - `ManagerGovernancePage` — the landing page, composing everything below
  - `ManagerGovernanceHeader` — title + Customize button
  - `GovernanceStatTiles` — 5 headline tiles (Active Policies, Policy Compliance, Risks to Manage, Pending Approvals, Training Completion)
  - `GovernanceOverviewCard` — Compliance by Area (progress bars), Risk Overview (`DonutChart`), Internal Control Status, in one card
  - `PoliciesTableCard` — a tab-filtered policy table (only "Active Policies" has content; Standards/Procedures/Guidelines are empty states)
  - `PendingApprovalsCard` — policy/budget/vendor approval requests awaiting review
  - `TrainingAwarenessCard` — a `DonutChart` completion rate plus per-course progress bars
  - `IncidentsReportsCard` — 4 mini incident stats
  - `AuditAssessmentCard` — internal (in-progress) and external (completed/scored) audits
  - `MyGovernanceTasksCard`, `PolicyUpdatesCard`, `QuickLinksCard` — right rail
- `mock-data.ts` — same "Marketing Manager" persona/team as the other manager variants (Mission Control, My Work, Intelligence, Workspaces)
