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

interface EditPhoneModalProps {
  userId: string;
  phone: string;
  onClose: () => void;
}

/**
 * A separate, single-field modal rather than folding phone into
 * `EditProfileModal` — the mockup edits it from "ข้อมูลติดต่อส่วนตัว" (the
 * contact tab's personal-contact section), a different card/context than
 * "ข้อมูลส่วนตัว"'s own edit button, even though both go through the same
 * `PATCH /users/:id`. Real since 2026-09-16, same commit as date_of_birth
 * — see `../services/profile-api.ts`'s header comment.
 */
export function EditPhoneModal({ userId, phone, onClose }: EditPhoneModalProps) {
  const router = useRouter();
  const [value, setValue] = useState(phone);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateUserProfile(userId, { phone: value.trim() || null });
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
      title="แก้ไขข้อมูลติดต่อส่วนตัว"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button type="submit" form="edit-phone-form" variant="primary" disabled={submitting}>
            {submitting ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </>
      }
    >
      <form id="edit-phone-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          โทรศัพท์มือถือ
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="เช่น 081-234-5678"
            className={inputClasses}
          />
        </label>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </Modal>
  );
}
