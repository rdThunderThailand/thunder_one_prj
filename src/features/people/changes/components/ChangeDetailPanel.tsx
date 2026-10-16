"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { UsersIcon, XIcon } from "@/components/ui/icons";
import type { ResolvedChangeRow } from "../mock-data";
import { statusBadge } from "./ChangeTable";

const DETAIL_TABS = ["ภาพรวม", "กระบวนการอนุมัติ", "ประวัติการดำเนินการ"] as const;

interface ChangeDetailPanelProps {
  change: ResolvedChangeRow | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onClose: () => void;
}

function SnapshotBlock({ title, snapshot }: { title: string; snapshot: { unit: string; team: string; manager: string; position: string } }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      <dl className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">หน่วยงาน</dt>
          <dd className="text-foreground">{snapshot.unit}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">ทีม</dt>
          <dd className="text-foreground">{snapshot.team}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">ผู้จัดการ</dt>
          <dd className="text-foreground">{snapshot.manager}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">ตำแหน่ง</dt>
          <dd className="text-foreground">{snapshot.position}</dd>
        </div>
      </dl>
    </div>
  );
}

// Approve/Reject is real, client-local state (owned by ChangesPage, one
// override per change id) — same "real button, not persisted, not reflected
// in this page's stat tiles/tabs" discipline as
// asset-intelligence/departments's RequestsPage.
export function ChangeDetailPanel({ change, onApprove, onReject, onClose }: ChangeDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<(typeof DETAIL_TABS)[number]>(DETAIL_TABS[0]);

  if (!change) {
    return (
      <Card className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 p-8 text-center">
        <UsersIcon className="h-6 w-6 text-t1-gray-400" />
        <p className="text-sm text-t1-gray-400">เลือกรายการเพื่อดูรายละเอียดการเปลี่ยนแปลง</p>
      </Card>
    );
  }

  const badge = statusBadge[change.resolvedStatus];

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">{change.name}</p>
          <p className="truncate text-xs text-t1-gray-400">{change.employeeCode}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="pill" color={badge.color}>
              {badge.label}
            </Badge>
            <Badge variant="pill" color="zinc">
              {change.changeTypeLabel}
            </Badge>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 text-t1-gray-400 hover:text-muted-foreground"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3 overflow-x-auto border-b border-border text-sm">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 border-b-2 px-0.5 pb-2 font-medium transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab !== DETAIL_TABS[0] ? (
        <div className="flex flex-1 items-center justify-center py-10 text-center text-sm text-t1-gray-400">
          ยังไม่มีข้อมูลสำหรับแท็บนี้
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 pt-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">รายละเอียดการเปลี่ยนแปลง</h3>
            <dl className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">ประเภทการเปลี่ยนแปลง</dt>
                <dd className="text-foreground">{change.changeTypeLabel}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">วันที่มีผล</dt>
                <dd className="text-foreground">{change.effectiveDateLabel}</dd>
              </div>
              {!change.before && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="shrink-0 text-muted-foreground">รายละเอียด</dt>
                  <dd className="text-right text-foreground">
                    {change.fromValue} → {change.toValue}
                  </dd>
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-muted-foreground">เหตุผล</dt>
                <dd className="text-right text-foreground">{change.reason}</dd>
              </div>
              {change.note && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-muted-foreground">หมายเหตุ</dt>
                  <dd className="text-right text-foreground">{change.note}</dd>
                </div>
              )}
            </dl>
          </div>

          {change.before && change.after && (
            <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
              <SnapshotBlock title="ข้อมูลก่อนเปลี่ยนแปลง" snapshot={change.before} />
              <SnapshotBlock title="ข้อมูลหลังเปลี่ยนแปลง" snapshot={change.after} />
            </div>
          )}

          <div className="mt-auto border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-foreground">{change.requesterName}</p>
                {change.requesterRole && <p className="text-xs text-t1-gray-400">{change.requesterRole}</p>}
              </div>
              <div className="text-right text-xs text-t1-gray-400">
                <p>วันที่ร้องขอ</p>
                <p>{change.requestedDateLabel}</p>
              </div>
            </div>

            {change.resolvedStatus === "pending-approval" && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onReject(change.id)}
                  className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-error hover:bg-error-muted"
                >
                  ปฏิเสธ
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(change.id)}
                  className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  อนุมัติ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
