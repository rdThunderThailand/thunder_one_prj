// Placeholder for "who is logged in, as an Employee/User" — there is no real
// session-based identity or RBAC wiring yet (no permission gates exist, see
// docs/adr/0021-role-vocabulary-reconciliation.md on the docs/rbac-role-vocabulary-adr
// branch). Employee/User maps to role_type="operator", code="employee" in
// public.roles once that wiring exists. Until then, employee-facing views
// across asset-intelligence/assets/asset-intelligence/issues/asset-intelligence/requests hardcode this id — lives here (not in
// any one feature) because it's used by more than one of them, per this repo's
// own convention for cross-feature shared values.
export const CURRENT_EMPLOYEE_ID = "emp-114";
export const CURRENT_EMPLOYEE_NAME = "Nattapong";
