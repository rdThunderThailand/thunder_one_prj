"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, ClockIcon, SearchIcon, XIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api/api-error";
import { formatThaiDate } from "@/lib/thai-date";
import {
  reviewPartnerApplication,
  type CorePartnerApplication,
  type PartnerApplicationStatus,
} from "../services/partner-applications-api";

const STATUS_LABEL: Record<PartnerApplicationStatus, string> = {
  PENDING: "รอตรวจสอบ",
  NEEDS_INFO: "รอข้อมูลเพิ่มเติมจากผู้สมัคร",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธแล้ว",
};

const STATUS_CLASSES: Record<PartnerApplicationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-600",
  NEEDS_INFO: "bg-blue-50 text-blue-600",
  APPROVED: "bg-emerald-50 text-emerald-600",
  REJECTED: "bg-red-50 text-red-600",
};

// "ประเภทปัจจุบัน" isn't a field on the row — it's derived the same way
// thunder_crm_lineoa's own sync_partner_membership_type trigger derives it:
// APPROVED flips membership.member_type to 'partner', anything else leaves
// it at the default 'user' ("customer" here is just that default, not a
// parallel application type).
function currentType(status: PartnerApplicationStatus): { label: string; classes: string } {
  return status === "APPROVED"
    ? { label: "พันธมิตร (Partner)", classes: "bg-violet-50 text-violet-600" }
    : { label: "ลูกค้า (Customer)", classes: "bg-zinc-100 text-zinc-600" };
}

// submitted_at is a UTC timestamp — slicing it would show the previous day
// for anything submitted before 07:00 Bangkok time.
function bangkokIsoDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

// Core returns the newest 100 with no filter params — filtering is
// client-side by design (thunder_core_API partner-applications contract).
function matchesSearch(row: CorePartnerApplication, query: string): boolean {
  if (!query) return true;
  const haystack = [row.tenant?.name, row.applicant?.name, row.applicant?.email, row.external_application_id]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return "บัญชีนี้ไม่มีสิทธิ์อนุมัติคำขอเป็นพันธมิตร (ต้องเป็น super_admin)";
    if (err.status === 409) return "รายการนี้ถูกเปลี่ยนแปลงจากที่อื่นแล้ว กำลังโหลดข้อมูลล่าสุดให้ใหม่";
    if (err.status === 404) return "ไม่พบคำขอนี้ อาจถูกลบหรือย้ายไปแล้ว";
    return err.message || "เซิร์ฟเวอร์ปฏิเสธคำขอนี้";
  }
  return err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก";
}

interface LeadApprovalPageProps {
  /** Real since 2026-09-23 — `../services/partner-applications-api.ts`'s
   *  `getPartnerApplications` (thunder_crm_lineoa.list_partner_applications_
   *  for_review, super_admin only). `null` when the fetch failed or the
   *  caller isn't a reviewer — same explicit-error-state discipline as
   *  every other feature in this app, not a silent fallback to mock rows. */
  applications: CorePartnerApplication[] | null;
}

export function LeadApprovalPage({ applications }: LeadApprovalPageProps) {
  const router = useRouter();
  const [rows, setRows] = useState(applications ?? []);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PartnerApplicationStatus | "ALL">("ALL");
  // router.refresh() (on a 409) re-renders the server route with fresh
  // `applications`; useState ignores new initial values, so re-seed here.
  const [seenApplications, setSeenApplications] = useState(applications);
  if (applications !== seenApplications) {
    setSeenApplications(applications);
    setRows(applications ?? []);
  }

  async function decide(row: CorePartnerApplication, status: Extract<PartnerApplicationStatus, "APPROVED" | "REJECTED" | "NEEDS_INFO">) {
    setPendingId(row.id);
    try {
      const updated = await reviewPartnerApplication(row.id, { status, version: row.version });
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(status === "APPROVED" ? "อนุมัติแล้ว" : status === "REJECTED" ? "ปฏิเสธแล้ว" : "ส่งคำขอข้อมูลเพิ่มเติมแล้ว");
    } catch (err) {
      toast.error(errorMessage(err));
      if (err instanceof ApiError && err.status === 409) router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  const pendingCount = rows.filter((row) => row.status === "PENDING").length;
  const approvedCount = rows.filter((row) => row.status === "APPROVED").length;
  const rejectedCount = rows.filter((row) => row.status === "REJECTED").length;
  const query = search.trim().toLowerCase();
  const visibleRows = rows.filter(
    (row) => (statusFilter === "ALL" || row.status === statusFilter) && matchesSearch(row, query)
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Lead Approval Workspace</p>
        <h1 className="text-2xl font-bold text-zinc-900">อนุมัติ Lead</h1>
        <p className="text-sm text-zinc-500">ตรวจสอบและอนุมัติคำขอเป็นพันธมิตร (Partner) ที่เข้ามาใหม่</p>
      </div>

      {applications === null ? (
        <Card className="p-10 text-center text-sm text-zinc-400">
          ไม่สามารถโหลดรายการคำขอได้ในขณะนี้ — บัญชีนี้อาจไม่มีสิทธิ์ตรวจสอบ (ต้องเป็น super_admin) หรือเซิร์ฟเวอร์ขัดข้องชั่วคราว
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <ClockIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm text-zinc-500">รอตรวจสอบ</p>
                <p className="text-2xl font-bold text-zinc-900">{pendingCount}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircleIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm text-zinc-500">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold text-zinc-900">{approvedCount}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                <XIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm text-zinc-500">ปฏิเสธแล้ว</p>
                <p className="text-2xl font-bold text-zinc-900">{rejectedCount}</p>
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ค้นหาชื่อองค์กร ผู้ติดต่อ..."
                  className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-blue-400 focus:outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as PartnerApplicationStatus | "ALL")}
                aria-label="กรองตามสถานะ"
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 focus:border-blue-400 focus:outline-none"
              >
                <option value="ALL">
                  สถานะ: ทั้งหมด
                </option>
                {(Object.keys(STATUS_LABEL) as PartnerApplicationStatus[]).map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    สถานะ: {STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
            </div>

            {rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-400">ยังไม่มีคำขอเป็นพันธมิตรเข้ามา</p>
            ) : visibleRows.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-400">ไม่พบคำขอที่ตรงกับการค้นหา</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-xs text-zinc-400">
                      <th className="py-2 font-medium">Tenant / องค์กร</th>
                      <th className="py-2 font-medium">ประเภทปัจจุบัน</th>
                      <th className="py-2 font-medium">ผู้สมัคร</th>
                      <th className="py-2 font-medium">วันที่ส่งคำขอ</th>
                      <th className="py-2 font-medium">สถานะคำขอ</th>
                      <th className="py-2 font-medium">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {visibleRows.map((row) => {
                      const type = currentType(row.status);
                      const busy = pendingId === row.id;
                      return (
                        <tr key={row.id}>
                          <td className="py-3">
                            <p className="font-semibold text-zinc-900">{row.tenant?.name ?? "-"}</p>
                            <p className="text-xs text-zinc-400">{row.external_application_id}</p>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${type.classes}`}>{type.label}</span>
                          </td>
                          <td className="py-3">
                            <p className="text-zinc-900">{row.applicant?.name ?? "-"}</p>
                            <p className="text-xs text-zinc-400">{row.applicant?.email ?? "-"}</p>
                          </td>
                          <td className="py-3 text-zinc-600">{formatThaiDate(bangkokIsoDate(row.submitted_at))}</td>
                          <td className="py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[row.status]}`}>
                              {STATUS_LABEL[row.status]}
                            </span>
                          </td>
                          <td className="py-3">
                            {row.status === "PENDING" ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => decide(row, "APPROVED")}
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  อนุมัติ
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => decide(row, "NEEDS_INFO")}
                                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  ขอข้อมูลเพิ่มเติม
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => decide(row, "REJECTED")}
                                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  ปฏิเสธ
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-300">
                                {row.status === "NEEDS_INFO" ? "รอผู้สมัครส่งข้อมูลเพิ่มเติม" : "—"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
