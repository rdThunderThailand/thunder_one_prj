"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircleIcon, InfoIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";

const inputClasses =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

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

type Step = "form" | "validating" | "unavailable";

/**
 * Matches the coordinating session's 6-step mockup for steps 1-3 (form →
 * validating). Steps 4-6 (success → "log out other devices?" → done) are
 * NOT built as shown: changing a password for real needs
 * `supabase.auth.updateUser({password})` (confirmed working in the sibling
 * Core repo's own dashboard), which needs a live Supabase browser session —
 * this app's session is Core's own `to_at` bearer cookie, not a Supabase
 * SSR session, and no Supabase client is wired up anywhere in this repo.
 * Rather than fake a success screen, step 3 always resolves to an honest
 * "unavailable" state. This is a known, flagged gap — see this feature's
 * README — not a silent stub.
 */
export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("form");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const passedRules = RULES.filter((r) => r.test(next)).length;

  function handleSubmit() {
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
    window.setTimeout(() => setStep("unavailable"), 900);
  }

  if (step === "validating") {
    return (
      <Modal open onClose={onClose} title="เปลี่ยนรหัสผ่าน" footer={null}>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">กำลังตรวจสอบ...</p>
          <p className="text-xs text-zinc-400">กรุณารอสักครู่</p>
        </div>
      </Modal>
    );
  }

  if (step === "unavailable") {
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
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400">
            <InfoIcon className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">ฟีเจอร์นี้ยังไม่เปิดใช้งานในตอนนี้</p>
          <p className="max-w-xs text-xs text-zinc-400">
            ระบบเปลี่ยนรหัสผ่านกำลังอยู่ระหว่างการเชื่อมต่อกับผู้ให้บริการยืนยันตัวตน ยังไม่สามารถเปลี่ยนรหัสผ่านได้ในขณะนี้
          </p>
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
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          รหัสผ่านปัจจุบัน
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClasses} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          รหัสผ่านใหม่
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClasses} />
        </label>
        <ul className="flex flex-col gap-1 text-xs">
          {RULES.map((rule) => {
            const passed = rule.test(next);
            return (
              <li key={rule.label} className={`flex items-center gap-1.5 ${passed ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
                {rule.label}
              </li>
            );
          })}
        </ul>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          ยืนยันรหัสผ่านใหม่
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClasses} />
        </label>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </Modal>
  );
}
