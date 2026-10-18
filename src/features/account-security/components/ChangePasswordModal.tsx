"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircleIcon, InfoIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/api-error";
import { changePassword } from "@/features/profile/services/profile-api";

const inputClasses =
  "w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none";

interface Rule {
  label: string;
  test: (pw: string) => boolean;
}

const RULES: Rule[] = [
  { label: "อย่างน้อย 8 ตัวอักษร", test: (pw) => pw.length >= 8 },
  { label: "มีตัวพิมพ์ใหญ่และตัวพิมพ์เล็ก", test: (pw) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { label: "มีตัวเลข", test: (pw) => /\d/.test(pw) },
  { label: "มีอักขระพิเศษ (เช่น !@#$%^&*)", test: (pw) => /[!@#$%^&*]/.test(pw) },
];

// Strength bar reuses the exact same 4 RULES the checklist below already
// checks in real time against the literal typed value — not a separate
// scoring heuristic, so the bar and the checklist can never disagree.
const STRENGTH_LABELS = ["อ่อนมาก", "อ่อน", "ปานกลาง", "ดี", "แข็งแรง"];
const STRENGTH_BAR_COLORS = ["bg-error", "bg-warning", "bg-warning", "bg-success", "bg-success"];
const STRENGTH_TEXT_COLORS = [
  "text-error",
  "text-warning",
  "text-warning",
  "text-t1-green-700",
  "text-t1-green-700",
];

type Step = "form" | "validating" | "success";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "รหัสผ่านปัจจุบันไม่ถูกต้อง";
    return err.message || "เซิร์ฟเวอร์ปฏิเสธคำขอนี้";
  }
  return err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน";
}

/**
 * `PATCH /api/core/v1/me/password` — real since 2026-09-16 (Core commit
 * `d33d21a`), see `profile-api.ts`'s `changePassword` for exactly what it
 * verifies. Steps 1-3 (form → validating → success) are now a genuine
 * end-to-end password change, not a UI mockup — no fabricated success
 * screen anymore.
 *
 * The mockup's steps 5-6 ("log out other devices?" → logging out) are
 * still NOT built: that needs a session/device-revoke endpoint, which
 * doesn't exist in Core yet (flagged, backlogged — see this feature's
 * README). Success closes straight through rather than offering a button
 * that would do nothing.
 */
export function ChangePasswordModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [step, setStep] = useState<Step>("form");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const passedRules = RULES.filter((r) => r.test(next)).length;

  async function handleSubmit() {
    setError(null);
    if (!current) {
      setError("กรุณากรอกรหัสผ่านปัจจุบัน");
      return;
    }
    if (passedRules < RULES.length) {
      setError("รหัสผ่านใหม่ยังไม่ตรงตามเงื่อนไขทั้งหมด");
      return;
    }
    if (next !== confirm) {
      setError("ยืนยันรหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    setStep("validating");
    try {
      await changePassword({ current_password: current, new_password: next });
      setStep("success");
      onSuccess?.();
    } catch (err) {
      setError(errorMessage(err));
      setStep("form");
    }
  }

  if (step === "validating") {
    return (
      <Modal open onClose={onClose} title="เปลี่ยนรหัสผ่าน" footer={null}>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-t1-blue-200 border-t-primary" />
          <p className="text-sm font-medium text-foreground">กำลังเปลี่ยนรหัสผ่าน...</p>
          <p className="text-xs text-t1-gray-400">กรุณารอสักครู่</p>
        </div>
      </Modal>
    );
  }

  if (step === "success") {
    return (
      <Modal
        open
        onClose={onClose}
        title="เปลี่ยนรหัสผ่าน"
        footer={
          <Button type="button" variant="primary" onClick={onClose}>
            ตกลง
          </Button>
        }
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-muted text-t1-green-700">
            <CheckCircleIcon className="h-7 w-7" />
          </span>
          <p className="text-sm font-medium text-foreground">เปลี่ยนรหัสผ่านเรียบร้อยแล้ว</p>
          <p className="max-w-xs text-xs text-t1-gray-400">รหัสผ่านของคุณได้รับการอัปเดตแล้ว</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="เปลี่ยนรหัสผ่าน"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit}>
            เปลี่ยนรหัสผ่าน
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          รหัสผ่านปัจจุบัน
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClasses} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          รหัสผ่านใหม่
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClasses} />
        </label>
        {next.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>ความปลอดภัยของรหัสผ่าน</span>
              <span className={STRENGTH_TEXT_COLORS[passedRules]}>{STRENGTH_LABELS[passedRules]}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-200 ${STRENGTH_BAR_COLORS[passedRules]}`}
                style={{ width: `${(passedRules / RULES.length) * 100}%` }}
              />
            </div>
          </div>
        )}
        <ul className="flex flex-col gap-1 text-xs">
          {RULES.map((rule) => {
            const passed = rule.test(next);
            return (
              <li key={rule.label} className={`flex items-center gap-1.5 ${passed ? "text-t1-green-700" : "text-t1-gray-400"}`}>
                <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
                {rule.label}
              </li>
            );
          })}
        </ul>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          ยืนยันรหัสผ่านใหม่
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClasses} />
        </label>
        {error && (
          <p className="flex items-start gap-1.5 text-xs text-error">
            <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
