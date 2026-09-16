"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/api-error";
import type { OrgUnitNode } from "@/features/people/org-structure";
import { updateUserProfile } from "@/features/profile";
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
 * disabled "Not built yet" stub. Originally scoped to department/job_title
 * (see docs/people/edit-member-department-job-title-field-requirements.md);
 * วันที่เริ่มงาน (start_date) added 2026-09-15, รหัสตำแหน่ง/ระดับตำแหน่ง
 * (position_code/level_role) added 2026-09-16 — all on the same
 * `PATCH /tenants/:id/members/:memberId`, confirmed live and fully
 * round-trip on Core's side (unlike when this modal was first built, this
 * is no longer a "build ahead, degrade gracefully" case). `router.refresh()`
 * on success re-runs the Server Component fetch in people/personnel/page.tsx
 * so the edited row reflects immediately.
 */
export function EditPersonnelModal({ row, tenantId, units, onClose }: EditPersonnelModalProps) {
  const router = useRouter();
  const [departmentId, setDepartmentId] = useState(row.departmentId ?? "");
  const [jobTitle, setJobTitle] = useState(row.position === "-" ? "" : row.position);
  const [startDate, setStartDate] = useState(row.startDate ?? "");
  const [positionCode, setPositionCode] = useState(row.positionCode ?? "");
  const [levelRole, setLevelRole] = useState(row.levelRole ?? "");
  const [firstNameTh, setFirstNameTh] = useState(row.firstNameTh ?? "");
  const [lastNameTh, setLastNameTh] = useState(row.lastNameTh ?? "");
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
        start_date: startDate || null,
        position_code: positionCode.trim() || null,
        level_role: levelRole.trim() || null,
      });
      // Separate endpoint/resource (users, not memberships) — see
      // ชื่อ (ไทย)'s field comment below. A failure here shouldn't undo the
      // membership fields that already saved successfully; report it as a
      // partial-success toast instead, same pattern
      // AddContractorWizardPage's own contract-fields follow-up call uses.
      if (row.userId) {
        try {
          await updateUserProfile(row.userId, {
            first_name_th: firstNameTh.trim() || null,
            last_name_th: lastNameTh.trim() || null,
          });
        } catch {
          toast.error("บันทึกข้อมูลอื่นสำเร็จ แต่บันทึกชื่อ (ไทย) ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        }
      }
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
        {/* ชื่อ (ไทย) — real since 2026-09-16, but written via
            updateUserProfile (PATCH /users/:id), a different Core
            endpoint/resource than every other field in this form (which all
            go through updateMember's PATCH /tenants/:id/members/:memberId
            above). Only rendered when row.userId is known (real rows always
            have it; mock rows never do). */}
        {row.userId && (
          <>
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              ชื่อ (ไทย)
              <input value={firstNameTh} onChange={(e) => setFirstNameTh(e.target.value)} className={inputClasses} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              นามสกุล (ไทย)
              <input value={lastNameTh} onChange={(e) => setLastNameTh(e.target.value)} className={inputClasses} />
            </label>
          </>
        )}
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
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          วันที่เริ่มงาน
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          รหัสตำแหน่ง (Position Code)
          <input
            value={positionCode}
            onChange={(e) => setPositionCode(e.target.value)}
            placeholder="เช่น POS-CEO"
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          ระดับตำแหน่ง (Level)
          <input
            value={levelRole}
            onChange={(e) => setLevelRole(e.target.value)}
            placeholder="เช่น Executive, Senior"
            className={inputClasses}
          />
        </label>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </Modal>
  );
}
