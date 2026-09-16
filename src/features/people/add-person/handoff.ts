// Shared sessionStorage key so add-person's employee wizard
// (AddEmployeeWizardPage) can hand a freshly-created NewHireRow to
// people/new-hires's roster after redirecting there — client-local only,
// never persisted, same "added rows never survive a refresh" discipline as
// every other people/* feature's addedRows state. A standalone file (no
// component imports) so both features can depend on it without pulling in
// each other's component trees.
export const NEW_HIRE_HANDOFF_KEY = "people:new-hire:just-added";
