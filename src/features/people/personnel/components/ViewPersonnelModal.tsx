import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { isOnProbation } from "../core-mapper";
import type { PersonnelRow, PersonnelType, WorkStatus } from "../mock-data";

const typeBadge: Record<PersonnelType, { label: string; color: BadgeColor }> = {
  employee: { label: "พนักงาน", color: "green" },
  contractor: { label: "ผู้รับเหมา", color: "blue" },
  partner: { label: "พันธมิตร", color: "indigo" },
  guest: { label: "แขก", color: "yellow" },
  inactive: { label: "พ้นสภาพ/ไม่ใช้งาน", color: "zinc" },
};

const statusDot: Record<WorkStatus, { label: string; color: BadgeColor }> = {
  active: { label: "ทำงานอยู่", color: "green" },
  "on-leave": { label: "ลาหยุด", color: "yellow" },
  invited: { label: "เชิญแล้ว", color: "zinc" },
  inactive: { label: "พ้นสภาพ", color: "red" },
};

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

interface ViewPersonnelModalProps {
  row: PersonnelRow;
  onClose: () => void;
  onEdit: () => void;
}

// Read-only detail view opened from the table/grid's 👁 action — new
// 2026-09-15 (this feature never had a per-row detail view before). Built
// entirely from fields PersonnelRow already carries, no new fetch.
export function ViewPersonnelModal({ row, onClose, onEdit }: ViewPersonnelModalProps) {
  const onProbation = isOnProbation(row.probationEndDate);
  return (
    <Modal
      open
      onClose={onClose}
      title={row.name}
      footer={
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          แก้ไขข้อมูล
        </button>
      }
    >
      <div className="flex items-center gap-3 pb-3">
        <Avatar name={row.name} src={row.avatarUrl} size={48} />
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{row.name}</p>
          <p className="truncate text-xs text-t1-gray-400">{row.email}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 pb-2">
        <Badge variant="pill" color={typeBadge[row.type].color}>
          {typeBadge[row.type].label}
        </Badge>
        <Badge variant="dot" color={statusDot[row.workStatus].color}>
          {statusDot[row.workStatus].label}
        </Badge>
        <Badge variant="pill" color={onProbation ? "yellow" : "green"}>
          {onProbation ? "ทดลองงาน" : "ปกติ"}
        </Badge>
      </div>
      <dl className="divide-y divide-border">
        <Row label="ชื่อ (ไทย)" value={row.nameTh || "-"} />
        <Row label="รหัสพนักงาน" value={row.employeeCode} />
        <Row label="ตำแหน่ง" value={row.position} />
        <Row label="รหัสตำแหน่ง" value={row.positionCode || "-"} />
        <Row label="ระดับตำแหน่ง" value={row.levelRole || "-"} />
        <Row label="หน่วยงาน" value={row.unit} />
        <Row
          label="วันที่เริ่มงาน"
          value={row.tenureLabel && row.tenureLabel !== "-" ? `${row.startDateLabel} (${row.tenureLabel})` : row.startDateLabel}
        />
      </dl>
    </Modal>
  );
}
