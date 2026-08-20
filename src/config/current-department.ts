// Placeholder for "which department is the logged-in Department Manager
// scoped to" — same reasoning as current-employee.ts: no real session-based
// identity or RBAC wiring exists yet (no permission gates, see
// docs/adr/0021-role-vocabulary-reconciliation.md on the docs/rbac-role-vocabulary-adr
// branch). Kept in its own file rather than folded into current-employee.ts
// since it's a different scoping concept (department, not person) used by a
// different set of features (asset-intelligence/departments, and asset-intelligence/assets's department-scoped
// views) — matches this repo's own convention of not overloading one config
// file with unrelated values.
export const CURRENT_DEPARTMENT_ID = "sales";
export const CURRENT_DEPARTMENT_NAME = "Sales Department";
