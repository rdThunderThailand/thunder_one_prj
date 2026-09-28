"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { ApiError } from "@/lib/api/api-error";
import { formatThaiDate } from "@/lib/thai-date";
import {
  approveAuroraMigrationRequest,
  type AuroraApprovalRole,
  type AuroraMigrationStatus,
  type CoreAuroraMigrationRequest,
} from "../services/aurora-migration-requests-api";

const STATUS_LABEL: Record<AuroraMigrationStatus, string> = {
  PENDING: "รอตรวจสอบ",
  NEEDS_INFO: "รอข้อมูลเพิ่มเติม",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธแล้ว",
};

const STATUS_CLASSES: Record<AuroraMigrationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-600",
  NEEDS_INFO: "bg-blue-50 text-blue-600",
  APPROVED: "bg-emerald-50 text-emerald-600",
  REJECTED: "bg-red-50 text-red-600",
};

const APPROVED_ROLE_LABEL: Record<AuroraApprovalRole, string> = {
  MEDIA_USER: "ผู้ใช้จัดการสื่อ",
  ON_SITE_USER: "ผู้ใช้หน้างาน",
};

const APPROVAL_ROLES = Object.keys(APPROVED_ROLE_LABEL) as AuroraApprovalRole[];

// Status-driven, not message-driven — Core's handoff doc says the error text
// isn't a stable contract. 404/409 also trigger a refresh (see approve()).
function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";
    if (err.status === 403) return "บัญชีนี้ไม่มีสิทธิ์อนุมัติคำขอย้ายระบบ Aurora";
    if (err.status === 404) return "ไม่พบคำขอนี้แล้ว กำลังโหลดรายการใหม่";
    if (err.status === 409) return "คำขอนี้มีคนตัดสินไปแล้ว กำลังโหลดรายการใหม่";
    if (err.status >= 500) return "ติดต่อระบบ LINE OA ไม่สำเร็จ ลองกดอนุมัติอีกครั้งได้";
    return err.message || "เซิร์ฟเวอร์ปฏิเสธคำขอนี้";
  }
  return err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอนุมัติ";
}

// created_at is UTC — same Bangkok-date conversion LeadApprovalPage uses.
function bangkokIsoDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function Chips({ values }: { values: string[] }) {
  if (values.length === 0) return <span className="text-xs text-zinc-300">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {values.map((value) => (
        <span
          key={value}
          className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

interface AuroraMigrationRequestsCardProps {
  requests: CoreAuroraMigrationRequest[];
}

/** Aurora migration requests from LINE OA. The reviewer picks the role to
 *  approve as — the requester's `aurora_roles` are context only, not mapped
 *  automatically (Core handoff doc). Approve is the only action: LINE OA has
 *  no reject / needs-info function yet. */
export function AuroraMigrationRequestsCard({ requests }: AuroraMigrationRequestsCardProps) {
  const router = useRouter();
  const [rows, setRows] = useState(requests);
  const [roleById, setRoleById] = useState<Record<string, AuroraApprovalRole>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  // router.refresh() (on a 404/409) re-renders the server route with fresh
  // `requests`; useState ignores new initial values, so re-seed here.
  const [seenRequests, setSeenRequests] = useState(requests);
  if (requests !== seenRequests) {
    setSeenRequests(requests);
    setRows(requests);
  }

  async function approve(row: CoreAuroraMigrationRequest, role: AuroraApprovalRole) {
    setPendingId(row.id);
    try {
      const updated = await approveAuroraMigrationRequest(row.id, role);
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`อนุมัติ ${updated.reference_no} เป็น${APPROVED_ROLE_LABEL[role]}แล้ว`);
    } catch (err) {
      toast.error(errorMessage(err));
      if (err instanceof ApiError && (err.status === 404 || err.status === 409)) router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card className="p-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">คำขอย้ายระบบ Aurora</h2>
        <p className="text-sm text-zinc-500">คำขอที่ส่งเข้ามาจาก LINE OA (100 รายการล่าสุด)</p>
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-400">ยังไม่มีคำขอย้ายระบบ Aurora เข้ามา</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs text-zinc-400">
                <th className="py-2 pr-3 font-medium">เลขอ้างอิง</th>
                <th className="py-2 pr-3 font-medium">ผู้ขอ</th>
                <th className="py-2 pr-3 font-medium">บริษัท / ตำแหน่ง</th>
                <th className="py-2 pr-3 font-medium">บทบาท / โมดูลที่ขอ</th>
                <th className="py-2 pr-3 font-medium">ไซต์</th>
                <th className="py-2 pr-3 font-medium">วันที่ส่งคำขอ</th>
                <th className="py-2 pr-3 font-medium">สถานะ</th>
                <th className="py-2 font-medium">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="align-top"
                >
                  <td className="py-3 pr-3">
                    <p className="whitespace-nowrap font-mono font-semibold text-zinc-900">{row.reference_no}</p>
                  </td>
                  <td className="py-3 pr-3">
                    <p className="text-zinc-900">
                      {row.first_name} {row.last_name}
                    </p>
                    {row.line_profile?.display_name ? (
                      <p className="text-xs text-zinc-400">LINE: {row.line_profile.display_name}</p>
                    ) : null}
                    <p className="text-xs text-zinc-400">{row.email}</p>
                    <p className="text-xs text-zinc-400">{row.phone}</p>
                  </td>
                  <td className="py-3 pr-3">
                    <p className="text-zinc-900">{row.company_name}</p>
                    <p className="text-xs text-zinc-400">{row.position ?? "-"}</p>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-col gap-1.5">
                      <Chips values={row.aurora_roles} />
                      <Chips values={row.aurora_modules} />
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <Chips values={row.sites} />
                  </td>
                  <td className="py-3 pr-3 text-zinc-600">{formatThaiDate(bangkokIsoDate(row.created_at))}</td>
                  <td className="py-3 pr-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[row.status]}`}>
                      {STATUS_LABEL[row.status]}
                    </span>
                    {row.approved_role ? (
                      <p className="mt-1 text-xs text-zinc-500">{APPROVED_ROLE_LABEL[row.approved_role]}</p>
                    ) : null}
                    {row.reviewer ? (
                      <p className="text-xs text-zinc-400">โดย {row.reviewer.name ?? row.reviewer.email ?? "-"}</p>
                    ) : null}
                  </td>
                  <td className="py-3">
                    {row.status === "PENDING" || row.status === "NEEDS_INFO" ? (
                      <div className="flex w-36 flex-col gap-1.5">
                        <select
                          value={roleById[row.id] ?? ""}
                          onChange={(event) =>
                            setRoleById((prev) => ({ ...prev, [row.id]: event.target.value as AuroraApprovalRole }))
                          }
                          disabled={pendingId === row.id}
                          aria-label={`บทบาทที่จะอนุมัติสำหรับ ${row.reference_no}`}
                          className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs text-zinc-700 focus:border-blue-400 focus:outline-none disabled:opacity-50"
                        >
                          <option
                            value=""
                            disabled
                          >
                            เลือกบทบาท…
                          </option>
                          {APPROVAL_ROLES.map((role) => (
                            <option
                              key={role}
                              value={role}
                            >
                              {APPROVED_ROLE_LABEL[role]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!roleById[row.id] || pendingId === row.id}
                          onClick={() => {
                            const role = roleById[row.id];
                            if (role) approve(row, role);
                          }}
                          className="whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {pendingId === row.id ? "กำลังอนุมัติ…" : "อนุมัติ"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
