"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/api-error";
import type { OrgUnitNode } from "@/features/people/org-structure";
import { updateMember } from "../services/members-api";
import type { PersonnelRow } from "../mock-data";

const inputClasses =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) {
      return "ยังแก้ไขไม่ได้ — Thunder_Core ยังไม่มี endpoint สำหรับแก้ไขข้อมูลนี้ (รอ Core ทำ PATCH /members/:id)";
    }
    if (err.status === 403) {
      return "บัญชีนี้ไม่มีสิทธิ์แก้ไขข้อมูลบุคลากรของ tenant นี้ (ต้องเป็น company_admin ขึ้นไป)";
    }
    return err.message || "เซิร์ฟเวอร์ปฏิเสธคำขอนี้";
  }
  return err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
}

interface EditPersonnelModalProps {
  row: PersonnelRow;
  tenantId: string;
  units: Record<string, OrgUnitNode>;
  onClose: () => void;
}

/**
 * Opened from PersonnelTable's row-action ("...") button — previously a
 * disabled "Not built yet" stub. Scoped to the two fields blocking real
 * onboarding (see docs/people/edit-member-department-job-title-field-
 * requirements.md): a bulk-created member's placeholder department/
 * job_title need fixing per-person afterward. Calls `updateMember()`
 * (services/members-api.ts), which 404s until Core ships the proposed
 * `PATCH /tenants/:id/members/:memberId` — same "build ahead of Core,
 * degrade gracefully" pattern as asset-intelligence/assets's
 * `EditAssetModal`/`updateAsset`. `router.refresh()` on success re-runs
 * the Server Component fetch in people/personnel/page.tsx so the edited
 * row reflects immediately.
 */
export function EditPersonnelModal({ row, tenantId, units, onClose }: EditPersonnelModalProps) {
  const router = useRouter();
  const [departmentId, setDepartmentId] = useState(row.departmentId ?? "");
  const [jobTitle, setJobTitle] = useState(row.position === "-" ? "" : row.position);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const unitOptions = Object.values(units).sort((a, b) => a.name.localeCompare(b.name));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateMember(tenantId, row.id, {
        default_department_id: departmentId || null,
        job_title: jobTitle.trim() || null,
      });
      router.refresh();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`แก้ไขข้อมูล — ${row.name}`}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button type="submit" form="edit-personnel-form" variant="primary" disabled={submitting}>
            {submitting ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </>
      }
    >
      <form id="edit-personnel-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          หน่วยงาน
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={inputClasses}>
            <option value="">ไม่ระบุ</option>
            {unitOptions.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          ตำแหน่งงาน
          <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClasses} />
        </label>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </Modal>
  );
}
