"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, WarningTriangleIcon } from "@/components/ui/icons";
import type { ScheduleConflict } from "../types";
import type { EligibilityCheck, EligibilityStatus } from "../publish-eligibility";
import { summarizePriorityConflicts } from "../publish-eligibility";

const ROWS: { id: EligibilityCheck["id"]; label: string }[] = [
  { id: "content", label: "Content is ready to play" },
  { id: "targets", label: "Targets are selected" },
  { id: "schedule", label: "Schedule is valid" },
  { id: "policy", label: "Content complies with policy" },
  { id: "conflicts", label: "No higher-priority Publication overrides this" },
];

export function ReviewChecklist({
  checks,
  conflicts,
  checkingConflicts,
  conflictsError,
  geometry,
  geometryStatus,
  offlineNames,
}: {
  checks: EligibilityCheck[];
  conflicts: ScheduleConflict[];
  checkingConflicts: boolean;
  conflictsError: string | null;
  geometry: { unfitting: string[]; unprofiled: string[] };
  geometryStatus: EligibilityStatus;
  offlineNames: string[];
}) {
  const priority = summarizePriorityConflicts(conflicts);

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="mb-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Checklist</h2>
            <p className="text-xs text-zinc-400">รายการตรวจสอบก่อนเผยแพร่</p>
          </div>
        </div>
        <ul className="space-y-2.5">
          {ROWS.map((row) => (
            <CheckRow
              key={row.id}
              label={`${row.label}${row.id === "conflicts" && conflicts.length ? ` (${conflicts.length})` : ""}`}
              status={checks.find((check) => check.id === row.id)?.status ?? "unknown"}
            />
          ))}
          <CheckRow label="Resolution / aspect fits the target" status={geometryStatus} />
        </ul>
      </Card>

      <Card className="border-amber-200 bg-amber-50 p-4 xl:min-h-[162px]">
        <h2 className="text-sm font-semibold text-zinc-900">Conflicts &amp; warnings</h2>
        <div className="mt-3 space-y-3 text-xs">
          {checkingConflicts || conflictsError ? (
            <Warning text={checkingConflicts ? "กำลังตรวจสอบ Priority conflicts" : "ตรวจสอบ Priority conflicts ไม่สำเร็จ — ยัง Publish ได้"} />
          ) : conflicts.length ? (
            <Warning text={priority.higherPriorityCount ? "มี Publication ที่ Priority สูงกว่ากดทับช่วงเวลานี้" : "พบ Publication อื่นในช่วงเวลาเดียวกัน"} />
          ) : (
            <Pass text="No schedule conflicts" />
          )}
          {conflicts.map((conflict) => (
            <Link key={conflict.publication_id} href={`/media-workspace/publications/${conflict.publication_id}`} className="block pl-6 text-zinc-600 underline underline-offset-2">
              {conflict.name} ({conflict.priority})
            </Link>
          ))}
          {offlineNames.length ? <Warning text={`Device offline: ${offlineNames.join(", ")}`} /> : <Pass text="No device issues" />}
          {geometry.unfitting.length > 0 && <Warning text={`Layout shape mismatch: ${geometry.unfitting.join(", ")}`} />}
          {geometry.unprofiled.length > 0 && <Warning text={`Screen size unknown: ${geometry.unprofiled.join(", ")}`} />}
        </div>
      </Card>
    </div>
  );
}

function CheckRow({ label, status }: { label: string; status: EligibilityStatus }) {
  return (
    <li className="flex items-center justify-between gap-3 text-xs text-zinc-600">
      <span>{label}</span>
      {status === "pass" ? <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" /> : status === "fail" ? <WarningTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" /> : <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-zinc-300" title="Unknown" />}
    </li>
  );
}

function Warning({ text }: { text: string }) {
  return <p className="flex items-start gap-2 text-amber-700"><WarningTriangleIcon className="h-4 w-4 shrink-0" />{text}</p>;
}

function Pass({ text }: { text: string }) {
  return <p className="flex items-start gap-2 text-zinc-600"><CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />{text}</p>;
}
