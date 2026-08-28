// Public API for the "people/personnel" feature.
export { PersonnelPage } from "./components/PersonnelPage";
// Exposed so other people/* features (e.g. new-hires's AddEmployeeModal) can
// source a "ผู้จัดการ"/position picker from the same roster this page's
// table shows, rather than free-text fields the two could drift out of sync
// on.
export { personnelRows } from "./mock-data";
// Real Core integration, exposed so other people/* features share it rather
// than each hitting Thunder_Core with their own copy — org-structure's
// core-mapper.ts resolves `manager_id` against `CoreMemberRow.user_id`;
// new-hires's AddEmployeeModal calls `createMember`/`getRoles` for its real
// "invite a new employee" flow.
export {
  createMember,
  getMembers,
  isPendingInvite,
  type CoreInviteResult,
  type CoreMemberRow,
  type CreateMemberInput,
} from "./services/members-api";
export { getRoles, type CoreRole } from "./services/roles-api";
