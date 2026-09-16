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
      <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <dl className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-zinc-500 dark:text-zinc-400">หน่วยงาน</dt>
          <dd className="text-zinc-900 dark:text-zinc-50">{snapshot.unit}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-zinc-500 dark:text-zinc-400">ทีม</dt>
          <dd className="text-zinc-900 dark:text-zinc-50">{snapshot.team}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-zinc-500 dark:text-zinc-400">ผู้จัดการ</dt>
          <dd className="text-zinc-900 dark:text-zinc-50">{snapshot.manager}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-zinc-500 dark:text-zinc-400">ตำแหน่ง</dt>
          <dd className="text-zinc-900 dark:text-zinc-50">{snapshot.position}</dd>
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
        <UsersIcon className="h-6 w-6 text-zinc-300" />
        <p className="text-sm text-zinc-400">เลือกรายการเพื่อดูรายละเอียดการเปลี่ยนแปลง</p>
      </Card>
    );
  }

  const badge = statusBadge[change.resolvedStatus];

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">{change.name}</p>
          <p className="truncate text-xs text-zinc-400">{change.employeeCode}</p>
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
          className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3 overflow-x-auto border-b border-zinc-100 text-sm dark:border-zinc-800">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 border-b-2 px-0.5 pb-2 font-medium transition-colors ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab !== DETAIL_TABS[0] ? (
        <div className="flex flex-1 items-center justify-center py-10 text-center text-sm text-zinc-400">
          ยังไม่มีข้อมูลสำหรับแท็บนี้
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 pt-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">รายละเอียดการเปลี่ยนแปลง</h3>
            <dl className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">ประเภทการเปลี่ยนแปลง</dt>
                <dd className="text-zinc-900 dark:text-zinc-50">{change.changeTypeLabel}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">วันที่มีผล</dt>
                <dd className="text-zinc-900 dark:text-zinc-50">{change.effectiveDateLabel}</dd>
              </div>
              {!change.before && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">รายละเอียด</dt>
                  <dd className="text-right text-zinc-900 dark:text-zinc-50">
                    {change.fromValue} → {change.toValue}
                  </dd>
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">เหตุผล</dt>
                <dd className="text-right text-zinc-900 dark:text-zinc-50">{change.reason}</dd>
              </div>
              {change.note && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">หมายเหตุ</dt>
                  <dd className="text-right text-zinc-900 dark:text-zinc-50">{change.note}</dd>
                </div>
              )}
            </dl>
          </div>

          {change.before && change.after && (
            <div className="grid grid-cols-1 gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800 sm:grid-cols-2">
              <SnapshotBlock title="ข้อมูลก่อนเปลี่ยนแปลง" snapshot={change.before} />
              <SnapshotBlock title="ข้อมูลหลังเปลี่ยนแปลง" snapshot={change.after} />
            </div>
          )}

          <div className="mt-auto border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-zinc-900 dark:text-zinc-50">{change.requesterName}</p>
                {change.requesterRole && <p className="text-xs text-zinc-400">{change.requesterRole}</p>}
              </div>
              <div className="text-right text-xs text-zinc-400">
                <p>วันที่ร้องขอ</p>
                <p>{change.requestedDateLabel}</p>
              </div>
            </div>

            {change.resolvedStatus === "pending-approval" && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onReject(change.id)}
                  className="flex-1 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                >
                  ปฏิเสธ
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(change.id)}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
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
