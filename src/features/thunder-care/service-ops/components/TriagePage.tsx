"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { CheckCircleIcon, CheckIcon, FilterIcon, RepeatIcon } from "@/components/ui/icons";
import {
  CHANNEL_LABEL,
  COMPLEXITY_OPTIONS,
  ISSUE_CATEGORY_OPTIONS,
  RECOMMENDED_ACTION_OPTIONS,
  SERVICE_CATEGORY_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  announcements,
  completenessChecklist,
  dashboardStats,
  slaRiskRows,
  triageQueueCases,
  waitingForCustomerRows,
  type DashboardStat,
  type ServiceCase,
} from "../mock-data";
import { channelIcon, priorityBadge, slaRiskTextColor } from "../status-colors";

// "Triage" — คิวเต็มของเคสที่รอตรวจสอบและจัดประเภท (ผังหน้าจอที่ผู้ใช้ส่งมา
// 2569-09-08, หน้าที่ 3) ค่าเริ่มต้นแสดงเป็นคิว/ตาราง; กด "Triage" ที่แถวไหน
// (หรือเข้ามาด้วย `?case=`) จะสลับไปโหมดรายละเอียด+ฟอร์ม Triage (ตรงกับ
// ขั้นตอน 2-3 ของ "ผังการใช้งาน Service Operator") — โต้ตอบได้จริงแค่ local
// state (เลือกเคส/กรอกฟอร์ม/กด "บันทึกและส่ง" แล้วเคสย้ายออกจากคิว) ไม่มี
// backend จริง เหมือน `DispatchControl`/`WorkOrderCard` ที่มีอยู่แล้วใน
// thunder-care/work-orders. Reload หน้าแล้วข้อมูลจะรีเซ็ตกลับที่เดิม.
const statColor: Record<DashboardStat["color"], string> = {
  zinc: "text-foreground",
  amber: "text-t1-amber-700",
  red: "text-t1-red-700",
  indigo: "text-primary",
  emerald: "text-t1-green-700",
};

const QUEUE_TABS = [
  { key: "pending-triage", label: "รอ Triage" },
  { key: "waiting-info", label: "รอข้อมูลลูกค้า" },
  { key: "sla-risk", label: "ใกล้/เกิน SLA" },
  { key: "new", label: "ทั้งหมด" },
] as const;

interface TriageFormState {
  serviceCategory: string;
  serviceType: string;
  issueCategory: string;
  priority: string;
  complexity: string;
  recommendedAction: string;
}

function initialFormState(serviceCase: ServiceCase): TriageFormState {
  const serviceCategory = SERVICE_CATEGORY_OPTIONS[0];
  return {
    serviceCategory,
    serviceType: SERVICE_TYPE_OPTIONS[serviceCategory][0],
    issueCategory: ISSUE_CATEGORY_OPTIONS[0],
    priority: serviceCase.priority === "high" ? "High" : serviceCase.priority === "medium" ? "Medium" : "Low",
    complexity: COMPLEXITY_OPTIONS[1],
    recommendedAction: RECOMMENDED_ACTION_OPTIONS[0],
  };
}

const selectClasses =
  "w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none";
const labelClasses = "flex flex-col gap-1 text-xs font-medium text-muted-foreground";

// ===== โหมดคิว (ค่าเริ่มต้นของหน้า) =====

function QueueStatsRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {dashboardStats.map((stat) => (
        <Card key={stat.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">{stat.id === "new" ? "เคสใหม่ (ทั้งหมด)" : stat.label}</p>
          <span className={`text-2xl font-semibold ${statColor[stat.color]}`}>{stat.value}</span>
          <p className="text-xs text-t1-gray-400">{stat.sublabel}</p>
        </Card>
      ))}
    </div>
  );
}

function QueueTable({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="w-8 px-3 py-2">
              <input type="checkbox" className="rounded border-border" disabled title="ยังไม่เปิดใช้งาน" />
            </th>
            <th className="px-3 py-2 font-medium">Ticket ID</th>
            <th className="px-3 py-2 font-medium">เรื่อง / ปัญหา</th>
            <th className="px-3 py-2 font-medium">ลูกค้า / สาขา</th>
            <th className="px-3 py-2 font-medium">Asset</th>
            <th className="px-3 py-2 font-medium">ช่องทาง</th>
            <th className="px-3 py-2 font-medium">วันเวลา</th>
            <th className="px-3 py-2 font-medium">ความเร่งด่วน</th>
            <th className="px-3 py-2 font-medium">SLA</th>
            <th className="px-3 py-2 font-medium">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {triageQueueCases.map((row) => {
            const ChannelIcon = channelIcon[row.channel];
            return (
              <tr key={row.id}>
                <td className="px-3 py-2.5">
                  <input type="checkbox" className="rounded border-border" disabled title="ยังไม่เปิดใช้งาน" />
                </td>
                <td className="px-3 py-2.5">
                  <p className="font-medium text-foreground">{row.id}</p>
                  <p className="text-[11px] text-primary">ใหม่</p>
                </td>
                <td className="px-3 py-2.5 text-foreground">{row.title}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  <p>{row.customerName}</p>
                  <p className="text-xs text-t1-gray-400">{row.branchLabel}</p>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  <p>{row.assetTag}</p>
                  <p className="text-xs text-t1-gray-400">{row.assetLabel}</p>
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ChannelIcon className="h-3.5 w-3.5" />
                    {CHANNEL_LABEL[row.channel]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">{row.reportedAtLabel}</td>
                <td className="px-3 py-2.5">
                  <Badge variant="pill" color={priorityBadge[row.priority].color}>
                    {priorityBadge[row.priority].label}
                  </Badge>
                </td>
                <td className={`whitespace-nowrap px-3 py-2.5 text-xs font-medium ${slaRiskTextColor[row.slaRisk]}`}>{row.slaRemainingLabel}</td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => onSelect(row.id)}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Triage
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function QueueSlaRiskCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-foreground">SLA Risk (ใกล้/เกิน SLA)</h2>
      <ul className="flex flex-col gap-3">
        {slaRiskRows.map((row) => (
          <li key={row.id} className="flex items-start gap-2.5">
            <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${row.risk === "overdue" ? "bg-error" : "bg-warning"}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{row.customerName}</p>
              <p className="truncate text-xs text-muted-foreground">{row.issueLabel}</p>
            </div>
            <span className="shrink-0 text-xs font-medium text-foreground">{row.timeLabel}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function QueueWaitingInfoCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-foreground">รายการที่รอข้อมูลลูกค้า</h2>
      <ol className="flex flex-col gap-2.5">
        {waitingForCustomerRows.map((row, index) => (
          <li key={row.id} className="flex items-center gap-2.5 text-sm">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{row.customerName}</p>
              <p className="truncate text-xs text-t1-gray-400">{row.reasonLabel}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function QueueAnnouncementsCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-foreground">ประกาศ / ข่าวสาร</h2>
      <ul className="flex flex-col gap-3">
        {announcements.slice(0, 2).map((row) => (
          <li key={row.id} className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-foreground">{row.title}</p>
            <p className="text-xs text-muted-foreground">{row.detail}</p>
            <p className="text-[11px] text-t1-gray-400">{row.dateLabel}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TriageQueueView({ onSelect }: { onSelect: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState<(typeof QUEUE_TABS)[number]["key"]>("pending-triage");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Triage</h1>
        <p className="text-sm text-muted-foreground">รายการเคสที่รอการตรวจสอบและจัดประเภท</p>
      </div>

      <QueueStatsRow />

      <div className="flex gap-1 border-b border-border">
        {QUEUE_TABS.map((tab) => {
          const stat = dashboardStats.find((s) => s.id === tab.key);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} {stat?.value ?? ""}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="ค้นหาในรายการนี้..." className="max-w-xs" />
            {["สถานะ: ทั้งหมด", "ความเร่งด่วน: ทั้งหมด", "ช่องทาง: ทั้งหมด", "ลูกค้า: ทั้งหมด"].map((label) => (
              <select key={label} disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
                <option>{label}</option>
              </select>
            ))}
            <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
              <FilterIcon className="h-3.5 w-3.5" /> ตัวกรองเพิ่มเติม
            </button>
            <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed text-t1-gray-400">
              <RepeatIcon className="h-4 w-4" />
            </button>
          </div>
          <QueueTable onSelect={onSelect} />
          <p className="text-right text-xs text-t1-gray-400">แสดง 1-{triageQueueCases.length} จาก {triageQueueCases.length} รายการ</p>
        </div>
        <div className="flex flex-col gap-4">
          <QueueSlaRiskCard />
          <QueueWaitingInfoCard />
          <QueueAnnouncementsCard />
        </div>
      </div>
    </div>
  );
}

// ===== โหมดรายละเอียด + ฟอร์ม Triage (หลังเลือกเคส) =====

function CaseListItem({
  serviceCase,
  active,
  dispatched,
  onSelect,
}: {
  serviceCase: ServiceCase;
  active: boolean;
  dispatched: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={dispatched}
      className={`flex w-full flex-col gap-1 rounded-xl border p-3 text-left transition ${
        dispatched
          ? "cursor-not-allowed border-border bg-muted opacity-60"
          : active
            ? "border-primary bg-accent/50"
            : "border-border hover:border-t1-gray-300"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{serviceCase.id}</span>
        {dispatched ? (
          <Badge variant="pill" color="green">ส่งแล้ว</Badge>
        ) : (
          <Badge variant="pill" color={priorityBadge[serviceCase.priority].color}>
            {priorityBadge[serviceCase.priority].label}
          </Badge>
        )}
      </div>
      <p className="truncate text-xs text-muted-foreground">{serviceCase.title}</p>
      <p className="truncate text-xs text-t1-gray-400">{serviceCase.customerName}</p>
    </button>
  );
}

function CompletenessCard() {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-t1-gray-400">ตรวจสอบความครบถ้วน</h3>
      <ul className="flex flex-col gap-1.5">
        {completenessChecklist.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            <CheckIcon className="h-3.5 w-3.5 shrink-0 text-success" />
            <span className="text-foreground">{item.label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TriageForm({ serviceCase, onSubmit }: { serviceCase: ServiceCase; onSubmit: () => void }) {
  const [form, setForm] = useState<TriageFormState>(() => initialFormState(serviceCase));

  return (
    <Card className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-semibold text-foreground">Triage</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelClasses}>
          Service Category
          <select
            value={form.serviceCategory}
            onChange={(e) => {
              const serviceCategory = e.target.value;
              setForm((prev) => ({ ...prev, serviceCategory, serviceType: SERVICE_TYPE_OPTIONS[serviceCategory][0] }));
            }}
            className={selectClasses}
          >
            {SERVICE_CATEGORY_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className={labelClasses}>
          Service Type
          <select
            value={form.serviceType}
            onChange={(e) => setForm((prev) => ({ ...prev, serviceType: e.target.value }))}
            className={selectClasses}
          >
            {SERVICE_TYPE_OPTIONS[form.serviceCategory].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className={labelClasses}>
          Issue Category
          <select
            value={form.issueCategory}
            onChange={(e) => setForm((prev) => ({ ...prev, issueCategory: e.target.value }))}
            className={selectClasses}
          >
            {ISSUE_CATEGORY_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className={labelClasses}>
          Priority
          <select
            value={form.priority}
            onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            className={selectClasses}
          >
            {["High", "Medium", "Low"].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className={labelClasses}>
          Complexity
          <select
            value={form.complexity}
            onChange={(e) => setForm((prev) => ({ ...prev, complexity: e.target.value }))}
            className={selectClasses}
          >
            {COMPLEXITY_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className={labelClasses}>
          Recommended Action
          <select
            value={form.recommendedAction}
            onChange={(e) => setForm((prev) => ({ ...prev, recommendedAction: e.target.value }))}
            className={selectClasses}
          >
            {RECOMMENDED_ACTION_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex justify-end">
        <Button variant="primary" onClick={onSubmit}>
          บันทึกและส่ง
        </Button>
      </div>
    </Card>
  );
}

function DispatchedConfirmation({ serviceCase }: { serviceCase: ServiceCase }) {
  return (
    <Card className="flex flex-col items-center gap-2 p-8 text-center">
      <CheckCircleIcon className="h-9 w-9 text-success" />
      <p className="text-sm font-medium text-foreground">ส่งสำเร็จ</p>
      <p className="text-xs text-t1-gray-400">Status: Ready to Dispatch</p>
      <p className="text-xs text-t1-gray-400">
        {serviceCase.id} · {serviceCase.title}
      </p>
    </Card>
  );
}

function TriageDetailView({ initialCaseId, onBack }: { initialCaseId: string; onBack: () => void }) {
  const [dispatchedIds, setDispatchedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string>(initialCaseId);

  const selectedCase = triageQueueCases.find((c) => c.id === selectedId) ?? null;
  const isDispatched = dispatchedIds.has(selectedId);

  function handleDispatch() {
    setDispatchedIds((prev) => new Set(prev).add(selectedId));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Triage</h1>
          <p className="text-sm text-muted-foreground">ตรวจสอบความครบถ้วนแล้วจัดประเภท/ลำดับความสำคัญก่อนส่งต่อ Dispatcher</p>
        </div>
        <button type="button" onClick={onBack} className="text-sm font-medium text-primary hover:text-accent-foreground">
          ← กลับไปที่คิว
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-2 p-3 lg:col-span-1">
          {triageQueueCases.map((c) => (
            <CaseListItem
              key={c.id}
              serviceCase={c}
              active={c.id === selectedId}
              dispatched={dispatchedIds.has(c.id)}
              onSelect={() => setSelectedId(c.id)}
            />
          ))}
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          {!selectedCase ? (
            <Card className="p-10 text-center text-sm text-t1-gray-400">เลือกเคสจากรายการด้านซ้ายเพื่อเริ่ม Triage</Card>
          ) : (
            <>
              <Card className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">
                    {selectedCase.id} · {selectedCase.title}
                  </h2>
                  <span className={`text-xs font-medium ${slaRiskTextColor[selectedCase.slaRisk]}`}>SLA {selectedCase.slaRemainingLabel}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedCase.customerName} · {selectedCase.branchLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  Asset: {selectedCase.assetTag} ({selectedCase.assetLabel})
                </p>
                <p className="text-xs text-t1-gray-400">
                  แจ้งเมื่อ {selectedCase.reportedAtLabel} · ผ่านช่องทาง {CHANNEL_LABEL[selectedCase.channel]}
                </p>
              </Card>

              <CompletenessCard />

              {isDispatched ? (
                <DispatchedConfirmation serviceCase={selectedCase} />
              ) : (
                <TriageForm serviceCase={selectedCase} onSubmit={handleDispatch} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== ตัวควบคุมโหมด (คิว ↔ รายละเอียด) =====

export function TriagePage({ initialCaseId }: { initialCaseId?: string }) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(
    initialCaseId && triageQueueCases.some((c) => c.id === initialCaseId) ? initialCaseId : null
  );

  if (selectedCaseId) {
    return <TriageDetailView initialCaseId={selectedCaseId} onBack={() => setSelectedCaseId(null)} />;
  }
  return <TriageQueueView onSelect={setSelectedCaseId} />;
}
