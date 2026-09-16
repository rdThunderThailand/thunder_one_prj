// R&D placeholder data for People Workspace's Changes page
// (`/people/changes`) — no backend yet, same discipline as this feature's
// sibling pages' mock-data.ts files.
//
// `changeTabs`/`changeStatTiles` carry the mockup's own header counts
// (8/3/3/1/1/0) as static labels; they are NOT derived from `changeRows` and
// don't update when a row is approved/rejected client-side (see
// ChangeDetailPanel's own comment on why) — same "mockup number vs. small
// sample" gap `people/personnel`'s mock-data.ts documents for itself.
export type ChangeType =
  | "transfer"
  | "position"
  | "manager"
  | "salary"
  | "employment-type"
  | "location"
  | "work-hours"
  | "company";

export type ChangeStatus = "pending-approval" | "in-progress" | "needs-info" | "completed" | "cancelled";

export interface ChangeStatTile {
  id: string;
  label: string;
  value: string;
  sublabel: string;
}

export const changeStatTiles: ChangeStatTile[] = [
  { id: "total", label: "ทั้งหมด", value: "8", sublabel: "รายการ" },
  { id: "pending-approval", label: "รออนุมัติ", value: "3", sublabel: "37.5%" },
  { id: "in-progress", label: "อยู่ระหว่างดำเนินการ", value: "3", sublabel: "37.5%" },
  { id: "needs-info", label: "รอข้อมูลเพิ่มเติม", value: "1", sublabel: "12.5%" },
  { id: "completed", label: "เสร็จสิ้น", value: "1", sublabel: "12.5%" },
];

export interface ChangeTab {
  id: ChangeStatus | "all";
  label: string;
  count: number;
}

export const changeTabs: ChangeTab[] = [
  { id: "all", label: "ทั้งหมด", count: 8 },
  { id: "pending-approval", label: "รออนุมัติ", count: 3 },
  { id: "in-progress", label: "อยู่ระหว่างดำเนินการ", count: 3 },
  { id: "needs-info", label: "รอข้อมูลเพิ่มเติม", count: 1 },
  { id: "completed", label: "เสร็จสิ้น", count: 1 },
  { id: "cancelled", label: "ยกเลิก", count: 0 },
];

export interface ChangeSnapshot {
  unit: string;
  team: string;
  manager: string;
  position: string;
}

export interface ChangeRow {
  id: string;
  name: string;
  employeeCode: string;
  changeType: ChangeType;
  changeTypeLabel: string;
  fromValue: string;
  toValue: string;
  effectiveDateLabel: string;
  status: ChangeStatus;
  requesterName: string;
  requesterRole: string | null;
  requestedDateLabel: string;
  updatedAgoLabel: string;
  reason: string;
  /** Only "c-1" (ณิชา รัตนกุล) has a note and a full before/after breakdown —
   *  the mockup's own verified detail-panel example. Every other row shows
   *  just fromValue → toValue in the panel, same "only build what the
   *  mockup showed" discipline as people/org-structure's detail panel. */
  note?: string;
  before?: ChangeSnapshot;
  after?: ChangeSnapshot;
}

export const changeRows: ChangeRow[] = [
  {
    id: "c-1",
    name: "ณิชา รัตนกุล",
    employeeCode: "EMP-0102",
    changeType: "transfer",
    changeTypeLabel: "ย้ายหน่วยงาน",
    fromValue: "Marketing / Content",
    toValue: "Marketing / Growth",
    effectiveDateLabel: "1 มิ.ย. 2569",
    status: "pending-approval",
    requesterName: "Jane Smith",
    requesterRole: "Marketing Manager",
    requestedDateLabel: "10 พ.ค. 2569",
    updatedAgoLabel: "2 วันแล้ว",
    reason: "สอดคล้องกับโครงสร้างองค์กรใหม่",
    note: "ต้องการเสริมทีม Growth Marketing",
    before: { unit: "Marketing / Content", team: "Content Team", manager: "Jane Smith", position: "Graphic Designer" },
    after: { unit: "Marketing / Growth", team: "Growth Team", manager: "Somchai W.", position: "Graphic Designer" },
  },
  {
    id: "c-2",
    name: "วรพล ศรีนคร",
    employeeCode: "EMP-0103",
    changeType: "position",
    changeTypeLabel: "เปลี่ยนตำแหน่ง",
    fromValue: "Software Developer",
    toValue: "Senior Developer",
    effectiveDateLabel: "15 พ.ค. 2569",
    status: "in-progress",
    requesterName: "Somchai W.",
    requesterRole: "Tech Lead",
    requestedDateLabel: "9 พ.ค. 2569",
    updatedAgoLabel: "3 วันแล้ว",
    reason: "ผลงานโดดเด่นและพร้อมรับผิดชอบเพิ่มขึ้น",
  },
  {
    id: "c-3",
    name: "อนันต์ ศรี",
    employeeCode: "EMP-0104",
    changeType: "manager",
    changeTypeLabel: "เปลี่ยนผู้จัดการ",
    fromValue: "Jane Smith",
    toValue: "Somchai W.",
    effectiveDateLabel: "20 พ.ค. 2569",
    status: "pending-approval",
    requesterName: "HR Admin",
    requesterRole: null,
    requestedDateLabel: "8 พ.ค. 2569",
    updatedAgoLabel: "4 วันแล้ว",
    reason: "ปรับโครงสร้างสายบังคับบัญชา",
  },
  {
    id: "c-4",
    name: "ปรีณา วงษ์ดี",
    employeeCode: "EMP-0105",
    changeType: "salary",
    changeTypeLabel: "ปรับเงินเดือน",
    fromValue: "45,000",
    toValue: "50,000",
    effectiveDateLabel: "1 มิ.ย. 2569",
    status: "needs-info",
    requesterName: "Jane Smith",
    requesterRole: "Marketing Manager",
    requestedDateLabel: "8 พ.ค. 2569",
    updatedAgoLabel: "4 วันแล้ว",
    reason: "ปรับเงินเดือนประจำปี รอเอกสารอนุมัติงบประมาณเพิ่มเติม",
  },
  {
    id: "c-5",
    name: "กิตติพงษ์ เลิศไพศาล",
    employeeCode: "EMP-0106",
    changeType: "employment-type",
    changeTypeLabel: "เปลี่ยนประเภทการจ้าง",
    fromValue: "พนักงานประจำ",
    toValue: "สัญญาจ้าง 1 ปี",
    effectiveDateLabel: "1 มิ.ย. 2569",
    status: "in-progress",
    requesterName: "HR Admin",
    requesterRole: null,
    requestedDateLabel: "7 พ.ค. 2569",
    updatedAgoLabel: "5 วันแล้ว",
    reason: "ปรับเปลี่ยนตามข้อตกลงการจ้างงานใหม่",
  },
  {
    id: "c-6",
    name: "สุภาวดี ชัประเสริฐ",
    employeeCode: "EMP-0107",
    changeType: "location",
    changeTypeLabel: "เปลี่ยนสถานที่ทำงาน",
    fromValue: "สำนักงานกรุงเทพฯ",
    toValue: "เชียงใหม่",
    effectiveDateLabel: "10 มิ.ย. 2569",
    status: "pending-approval",
    requesterName: "Somchai W.",
    requesterRole: "Tech Lead",
    requestedDateLabel: "6 พ.ค. 2569",
    updatedAgoLabel: "6 วันแล้ว",
    reason: "ย้ายตามคำร้องขอส่วนตัว",
  },
  {
    id: "c-7",
    name: "พชร เจริญยศ",
    employeeCode: "EMP-0108",
    changeType: "work-hours",
    changeTypeLabel: "เปลี่ยนเวลาทำงาน",
    fromValue: "09:00–18:00",
    toValue: "08:00–17:00",
    effectiveDateLabel: "1 มิ.ย. 2569",
    status: "completed",
    requesterName: "HR Admin",
    requesterRole: null,
    requestedDateLabel: "5 พ.ค. 2569",
    updatedAgoLabel: "7 วันแล้ว",
    reason: "ปรับเวลาทำงานให้สอดคล้องกับทีมต่างประเทศ",
  },
  {
    id: "c-8",
    name: "ธนพร แสนดี",
    employeeCode: "EMP-0109",
    changeType: "company",
    changeTypeLabel: "เปลี่ยนสังกัดบริษัท",
    fromValue: "ThunderOne Co., Ltd.",
    toValue: "CityZen Co., Ltd.",
    effectiveDateLabel: "1 ก.ค. 2569",
    status: "pending-approval",
    requesterName: "HR Admin",
    requesterRole: null,
    requestedDateLabel: "3 พ.ค. 2569",
    updatedAgoLabel: "9 วันแล้ว",
    reason: "โอนย้ายตามโครงสร้างกลุ่มบริษัท",
  },
];

export const changeTotalCount = 8;
export const changePageSize = 10;

/** A row with its client-local approve/reject override already resolved —
 *  see ChangesPage's own comment for why the override lives there, not here. */
export interface ResolvedChangeRow extends ChangeRow {
  resolvedStatus: ChangeStatus;
}
