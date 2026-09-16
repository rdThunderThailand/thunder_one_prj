"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/api-error";
import { updateUserProfile } from "../services/profile-api";

const inputClasses =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return "บัญชีนี้ไม่มีสิทธิ์แก้ไขข้อมูลนี้";
    return err.message || "เซิร์ฟเวอร์ปฏิเสธคำขอนี้";
  }
  return err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
}

interface EditProfileModalProps {
  userId: string;
  firstName: string;
  lastName: string;
  firstNameTh: string;
  lastNameTh: string;
  /** "" when unset — Core stores it as a plain `date` column, `<input
   *  type="date">` already speaks the same "YYYY-MM-DD" format both ways. */
  dateOfBirth: string;
  onClose: () => void;
}

/**
 * `PATCH /api/core/v1/users/{id}` only accepts a narrow field set
 * (`updateProfileSchema` in Core's member-view.ts) — this modal is scoped to
 * exactly the fields the mockup's "ข้อมูลส่วนตัว" tab shows as editable: the
 * Thai-script name pair (real since 2026-09-16, see `../services/
 * profile-api.ts`'s own header comment for the full history) and, real
 * since the same day, date of birth. `display_name`/avatar/timezone/
 * language have no write path at all — not offered here.
 */
export function EditProfileModal({ userId, firstName, lastName, firstNameTh, lastNameTh, dateOfBirth, onClose }: EditProfileModalProps) {
  const router = useRouter();
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [firstTh, setFirstTh] = useState(firstNameTh);
  const [lastTh, setLastTh] = useState(lastNameTh);
  const [dob, setDob] = useState(dateOfBirth);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateUserProfile(userId, {
        first_name: first.trim() || null,
        last_name: last.trim() || null,
        first_name_th: firstTh.trim() || null,
        last_name_th: lastTh.trim() || null,
        date_of_birth: dob || null,
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
      title="แก้ไขข้อมูลส่วนตัว"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button type="submit" form="edit-profile-form" variant="primary" disabled={submitting}>
            {submitting ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </>
      }
    >
      <form id="edit-profile-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          ชื่อ (ไทย)
          <input value={firstTh} onChange={(e) => setFirstTh(e.target.value)} className={inputClasses} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          นามสกุล (ไทย)
          <input value={lastTh} onChange={(e) => setLastTh(e.target.value)} className={inputClasses} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          ชื่อ
          <input value={first} onChange={(e) => setFirst(e.target.value)} className={inputClasses} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          นามสกุล
          <input value={last} onChange={(e) => setLast(e.target.value)} className={inputClasses} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          วันเดือนปีเกิด
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputClasses} />
        </label>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </Modal>
  );
}
