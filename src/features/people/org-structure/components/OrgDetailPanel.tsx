"use client";

import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ChevronRightIcon, MoreIcon, UsersIcon, XIcon } from "@/components/ui/icons";
import type { OrgUnitNode } from "../mock-data";

const DETAIL_TABS = ["ภาพรวม", "ทีม", "พนักงาน", "ตำแหน่งงาน", "ข้อมูลเพิ่มเติม"] as const;

interface OrgDetailPanelProps {
  units: Record<string, OrgUnitNode>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-right text-zinc-900 dark:text-zinc-50">{value}</dd>
    </div>
  );
}

// Only "ภาพรวม" has real content — the other four tabs render the same
// "no data for this tab" placeholder as asset-intelligence/assets's
// AllocationTabs, since no mockup exists for what they'd show.
export function OrgDetailPanel({ units, selectedId, onSelect, onClose }: OrgDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<(typeof DETAIL_TABS)[number]>(DETAIL_TABS[0]);
  const unit = selectedId ? units[selectedId] : null;

  if (!unit) {
    return (
      <Card className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 p-8 text-center">
        <UsersIcon className="h-6 w-6 text-zinc-300" />
        <p className="text-sm text-zinc-400">เลือกหน่วยงานในแผนผังเพื่อดูรายละเอียด</p>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <UsersIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">{unit.name}</p>
          {unit.headName && (
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {unit.headTitle}: {unit.headName}
            </p>
          )}
          <Badge variant="pill" color="green" className="mt-1.5">
            Active
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-zinc-400">
          <button
            type="button"
            title="Not built yet"
            className="cursor-not-allowed hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <MoreIcon className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} aria-label="Close" className="hover:text-zinc-600 dark:hover:text-zinc-300">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
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
          <dl className="space-y-3 text-sm">
            <DetailRow label="รหัสหน่วยงาน" value={unit.unitCode} />
            <DetailRow label="ประเภทหน่วยงาน" value={unit.unitType} />
            <DetailRow
              label="หัวหน้าหน่วยงาน"
              value={
                unit.headName ? (
                  <span className="flex items-center gap-2">
                    <Avatar name={unit.headName} size={22} />
                    <span>
                      <span className="block text-zinc-900 dark:text-zinc-50">{unit.headName}</span>
                      {unit.headTitle && <span className="block text-xs text-zinc-400">{unit.headTitle}</span>}
                    </span>
                  </span>
                ) : (
                  <span className="text-zinc-300 dark:text-zinc-600">-</span>
                )
              }
            />
            <DetailRow label="พนักงานทั้งหมด" value={`${unit.employeeCount} คน`} />
            <DetailRow label="ทีมทั้งหมด" value={`${unit.teamsCount} ทีม`} />
            <DetailRow
              label="ตำแหน่งงาน"
              value={unit.positionsCount !== null ? `${unit.positionsCount} ตำแหน่ง` : "-"}
            />
            <div className="flex items-center justify-between gap-3">
              <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">อัตราบรรจุ</dt>
              <dd className="flex w-32 items-center gap-2">
                {unit.fillRate !== null ? (
                  <>
                    <ProgressBar value={unit.fillRate} className="flex-1" />
                    <span className="w-9 shrink-0 text-right text-xs text-zinc-500 dark:text-zinc-400">
                      {unit.fillRate}%
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-zinc-300 dark:text-zinc-600">-</span>
                )}
              </dd>
            </div>
          </dl>

          {unit.childIds.length > 0 && (
            <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">หน่วยงานย่อย</h3>
                <span
                  title="Not built yet"
                  className="cursor-not-allowed text-xs font-medium text-indigo-600 dark:text-indigo-400"
                >
                  ดูทั้งหมด
                </span>
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {unit.childIds.map((childId) => {
                  const child = units[childId];
                  return (
                    <li key={childId}>
                      <button
                        type="button"
                        onClick={() => onSelect(childId)}
                        className="flex w-full items-center justify-between gap-2 py-2 text-left text-sm hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <span className="text-zinc-700 dark:text-zinc-200">{child.name}</span>
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          {child.employeeCount} คน
                          <ChevronRightIcon className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="mt-auto flex flex-col gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">การดำเนินการ</h3>
            <button
              type="button"
              title="Not built yet"
              className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
            >
              แก้ไขหน่วยงาน
            </button>
            <button
              type="button"
              title="Not built yet"
              className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-500 dark:border-red-500/30"
            >
              ลบหน่วยงาน
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
