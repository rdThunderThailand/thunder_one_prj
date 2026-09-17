// Public API for the "people/personnel" feature.
export { PersonnelPage } from "./components/PersonnelPage";
// Real position-name list, shared with people/add-person's 3 wizards for
// their position autocomplete (see core-mapper.ts's own header comment) —
// replaced the old `personnelRows` mock export 2026-09-17.
export { derivePositionOptions } from "./core-mapper";
// Real Core integration, exposed so other people/* features share it rather
// than each hitting Thunder_Core with their own copy — org-structure's
// core-mapper.ts resolves `manager_id` against `CoreMemberRow.user_id`;
// new-hires's AddEmployeeModal calls `createMember`/`getRoles` for its real
// "invite a new employee" flow.
export {
  checkEmailTaken,
  createEmployee,
  createMember,
  getMembers,
  isPendingInvite,
  updateMember,
  updateMemberContract,
  type CoreEmployeeResult,
  type CoreInviteResult,
  type CoreMemberRow,
  type CreateEmployeeInput,
  type CreateMemberInput,
  type MemberContract,
  type UpdateMemberContractInput,
  type UpdateMemberInput,
} from "./services/members-api";
export { getRoles, type CoreRole } from "./services/roles-api";
