import { Card } from "@/components/ui/Card";
import { formatThaiDate } from "@/lib/thai-date";
import type {
  AuroraApprovalRole,
  AuroraMigrationStatus,
  CoreAuroraMigrationRequest,
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

/** Read-only list of Aurora migration requests from LINE OA. Approving
 *  (POST /aurora-migration-requests/:id/approve) isn't wired yet. */
export function AuroraMigrationRequestsCard({ requests }: AuroraMigrationRequestsCardProps) {
  return (
    <Card className="p-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">คำขอย้ายระบบ Aurora</h2>
        <p className="text-sm text-zinc-500">คำขอที่ส่งเข้ามาจาก LINE OA (100 รายการล่าสุด)</p>
      </div>

      {requests.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-400">ยังไม่มีคำขอย้ายระบบ Aurora เข้ามา</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs text-zinc-400">
                <th className="py-2 pr-3 font-medium">เลขอ้างอิง</th>
                <th className="py-2 pr-3 font-medium">ผู้ขอ</th>
                <th className="py-2 pr-3 font-medium">บริษัท / ตำแหน่ง</th>
                <th className="py-2 pr-3 font-medium">บทบาท / โมดูลที่ขอ</th>
                <th className="py-2 pr-3 font-medium">ไซต์</th>
                <th className="py-2 pr-3 font-medium">วันที่ส่งคำขอ</th>
                <th className="py-2 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {requests.map((row) => (
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
                  <td className="py-3">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
