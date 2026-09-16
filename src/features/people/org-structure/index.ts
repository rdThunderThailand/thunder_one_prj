// Public API for the "people/org-structure" feature.
export { OrgStructurePage } from "./components/OrgStructurePage";
// Exposed so other people/* features (e.g. new-hires's AddEmployeeModal) can
// source a "หน่วยงาน" picker from the same org units this page's chart shows,
// rather than a free-text field the two could drift out of sync on.
export { orgUnits, type OrgUnitNode } from "./mock-data";
