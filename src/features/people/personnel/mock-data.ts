// Types + UI config for People Workspace's Personnel list (`/people/personnel`)
// — the roster itself is real (Core's GET /tenants/:id/members, see
// core-mapper.ts). The `personnelRows` hand-picked mock sample that used to
// live in this file was removed 2026-09-17 (readability/no-mock-data audit)
// once its last real consumer — the add-person wizards' position-name
// autocomplete — was switched to `derivePositionOptions()` over the real
// fetched roster instead (see core-mapper.ts).
export type PersonnelType = "employee" | "contractor" | "partner" | "guest" | "inactive";
export type WorkStatus = "active" | "on-leave" | "invited" | "inactive";

// 2026-09-01: redesigned from type-filter tabs (ทั้งหมด/พนักงาน/ผู้รับเหมา/…)
// into the mockup's 5 view tabs — a different axis (how the roster is
// grouped/displayed) rather than a row filter. Only "roster" has any mockup
// content (today's real table); the other 4 render the same "ยังไม่มีข้อมูล
// สำหรับแท็บนี้" placeholder people/org-structure's OrgStructurePage already
// uses for its own unbuilt tabs.
export type PersonnelViewTab = "roster" | "by-unit" | "by-position" | "by-employment-status" | "probation";

export interface PersonnelViewTabItem {
  id: PersonnelViewTab;
  label: string;
}

export const personnelViewTabs: PersonnelViewTabItem[] = [
  { id: "roster", label: "รายชื่อบุคลากร" },
  { id: "by-unit", label: "พนักงานตามหน่วยงาน" },
  { id: "by-position", label: "พนักงานตามตำแหน่ง" },
  { id: "by-employment-status", label: "สถานะการจ้างงาน" },
  { id: "probation", label: "พนักงานทดลองงาน" },
];

// `PersonnelStatTile`/`personnelStatTiles` (the old 3-tile mock) removed
// 2026-09-15 — พนักงานทั้งหมด/ผู้ปฏิบัติงานภายนอก/เข้าใหม่ (เดือนนี้) are all
// real now (computed in PersonnelPage from the fetched roster).
// `personnelRetentionRate` (a synthetic 94.1%, "อัตราการคงอยู่") removed
// 2026-09-16 — no offboarding/departure entity exists in Core at all to
// compute a real retention rate from (same gap as /people/departures);
// PersonnelStatTilesRow dropped the tile entirely rather than keep showing
// a fabricated number.

export interface PersonnelRow {
  id: string;
  /** Raw `user_id` (distinct from `id`, the membership id) — needed since
   *  2026-09-16 to edit `nameTh` below, which lives on `users` and is
   *  written via `PATCH /users/:id` (`updateUserProfile`), a different
   *  endpoint/resource than the membership-level PATCH `id` above goes
   *  through. Omitted (not `null`) on mock rows, same reasoning as
   *  departmentId below. */
  userId?: string;
  name: string;
  /** Real `first_name_th`/`last_name_th` — added 2026-09-16, see
   *  `CoreMemberRow.user`'s own comment. Kept as separate raw fields (not
   *  just a joined display string) so EditPersonnelModal can pre-populate
   *  two distinct inputs, same reasoning as departmentId/startDate below —
   *  writable via `updateUserProfile` (`@/features/profile`), a different
   *  endpoint than the rest of this modal's fields (see `userId` above). */
  firstNameTh?: string | null;
  lastNameTh?: string | null;
  /** `firstNameTh`/`lastNameTh` joined for display — `null` when neither is
   *  set. Kept separate from `name` (the primary/fallback name) rather than
   *  merged into it, since Core keeps them as genuinely distinct columns. */
  nameTh?: string | null;
  email: string;
  employeeCode: string;
  position: string;
  /** Raw `memberships.position_code`/`level_role` (e.g. "POS-CEO"/
   *  "Executive") — real since 2026-09-16, round-trip confirmed directly
   *  against `thunder_core_API`. Free text, not a closed set on Core's
   *  side. Omitted (not `null`) on mock rows, same reasoning as
   *  departmentId below. */
  positionCode?: string | null;
  levelRole?: string | null;
  unit: string;
  /** Raw `default_department_id`, for pre-selecting the right option in
   *  EditPersonnelModal's department dropdown — `unit` above is already a
   *  resolved display label ("Parent / Child"), not usable as a form value.
   *  Omitted (not `null`) on mock rows, which never had a real id to carry. */
  departmentId?: string | null;
  type: PersonnelType;
  workStatus: WorkStatus;
  startDateLabel: string;
  /** Raw `start_date` ("YYYY-MM-DD"), alongside the formatted
   *  `startDateLabel` — added 2026-09-15 so EditPersonnelModal's date input
   *  can be pre-populated with a real value, not just displayed. Same
   *  optional-not-null reasoning as departmentId above. */
  startDate?: string | null;
  /** "N ปี M เดือน" duration since startDate, computed once in
   *  core-mapper.ts rather than re-derived per render. "-" when no
   *  startDate. Added 2026-09-15 for the redesigned table's "วันที่เริ่มงาน /
   *  ระยะเวลา" column. */
  tenureLabel?: string;
  /** Real `user.avatar_url` — added 2026-09-15. This app has no photo
   *  upload feature anywhere yet, so this is almost always `null` in
   *  practice (Avatar falls back to initials) even though the field itself
   *  is real. */
  avatarUrl?: string | null;
  /** Raw `probation_end_date` ("YYYY-MM-DD") — added 2026-09-15, same
   *  "confirmed already in Core's MEMBER_SELECT, frontend type hadn't
   *  caught up" story as member_type/start_date before it. "On probation"
   *  is derived (compare to today), not stored as a separate boolean, so
   *  there's one source of truth and it can't drift as today's date moves
   *  forward. */
  probationEndDate?: string | null;
  managerName: string | null;
  managerRole: string | null;
}

// `personnelTotalCount`/`personnelPageSize`/`personnelTotalPages` (the old
// static mock numbers) removed 2026-09-15 once PersonnelTableControls
// started doing real client-side pagination over the fetched roster.
