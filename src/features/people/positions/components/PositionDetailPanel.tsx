import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MoreIcon, UsersIcon, XIcon } from "@/components/ui/icons";
import type { PositionRow, PositionStatus } from "../mock-data";

const statusBadge: Record<PositionStatus, { label: string; color: BadgeColor }> = {
  open: { label: "เปิดรับ", color: "blue" },
  filled: { label: "มีคนครอง", color: "green" },
  closed: { label: "ปิดรับ", color: "zinc" },
  cancelled: { label: "ยกเลิก", color: "red" },
};

const levelLabel: Record<PositionRow["level"], string> = {
  executive: "ระดับบริหาร",
  manager: "ระดับหัวหน้างาน",
  operator: "ระดับปฏิบัติงาน",
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

interface PositionDetailPanelProps {
  rows: PositionRow[];
  selectedId: string | null;
  onClose: () => void;
}

export function PositionDetailPanel({ rows, selectedId, onClose }: PositionDetailPanelProps) {
  const position = selectedId ? rows.find((row) => row.id === selectedId) : null;

  if (!position) {
    return (
      <Card className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 p-8 text-center">
        <UsersIcon className="h-6 w-6 text-t1-gray-400" />
        <p className="text-sm text-t1-gray-400">เลือกตำแหน่งงานเพื่อดูรายละเอียด</p>
      </Card>
    );
  }

  const fillRate = position.total > 0 ? Math.round((position.filled / position.total) * 100) : 0;

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">{position.name}</p>
          <p className="truncate text-xs text-t1-gray-400">{position.code}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-t1-gray-400">
          <button type="button" title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed hover:text-muted-foreground">
            <MoreIcon className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} aria-label="Close" className="hover:text-muted-foreground">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground">ข้อมูลตำแหน่ง</h3>
        <dl className="space-y-3 text-sm">
          <DetailRow label="รหัสตำแหน่ง" value={position.code} />
          <DetailRow label="หน่วยงาน" value={position.unit} />
          <DetailRow label="ระดับตำแหน่ง" value={levelLabel[position.level]} />
          <DetailRow
            label="สถานะ"
            value={
              <Badge variant="pill" color={statusBadge[position.status].color}>
                {statusBadge[position.status].label}
              </Badge>
            }
          />
        </dl>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground">อัตรากำลัง</h3>
        <p className="mt-1 text-2xl font-semibold text-foreground">
          {position.filled}/{position.total}
        </p>
        <ProgressBar value={fillRate} className="mt-2" />
        <p className="mt-1.5 text-xs text-t1-gray-400">{fillRate}% ของอัตรากำลังทั้งหมด</p>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <h3 className="mb-2 text-sm font-semibold text-foreground">ผู้ครองตำแหน่งปัจจุบัน</h3>
        {position.managerName ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={position.managerName} size={32} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{position.managerName}</p>
              <p className="truncate text-xs text-t1-gray-400">{position.managerRole}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-t1-gray-400">ยังไม่มีผู้ครองตำแหน่ง</p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground">การดำเนินการ</h3>
        {["ดูรายละเอียดตำแหน่ง", "แก้ไขตำแหน่ง", "ประวัติการเปลี่ยนแปลง"].map((label) => (
          <button
            key={label}
            type="button"
            title="ยังไม่เปิดใช้งาน"
            className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground"
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          title="ยังไม่เปิดใช้งาน"
          className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-error/30 py-2 text-sm font-medium text-error"
        >
          ยกเลิกตำแหน่ง
        </button>
      </div>
    </Card>
  );
}
