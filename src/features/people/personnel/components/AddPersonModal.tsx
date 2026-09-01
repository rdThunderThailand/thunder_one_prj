"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { WizardSteps } from "@/components/ui/WizardSteps";
import { ArrowRightIcon, CheckCircleIcon, UsersIcon } from "@/components/ui/icons";
import type { PersonnelRow, PersonnelType, WorkStatus } from "../mock-data";

type AddablePersonnelType = Exclude<PersonnelType, "inactive">;

const TYPE_INFO: Record<AddablePersonnelType, { label: string; description: string }> = {
  employee: { label: "พนักงาน (Employee)", description: "มีเงินเดือน สวัสดิการ นับรวมใน Headcount" },
  contractor: { label: "ผู้รับเหมา (Contractor)", description: "ทำงานตามสัญญาจ้าง ระยะเวลาชัดเจน ไม่นับรวมใน Headcount" },
  partner: { label: "พันธมิตร (Partner)", description: "คู่ค้า/พันธมิตรธุรกิจ เข้าถึงเฉพาะข้อมูลตามสิทธิ์ที่กำหนด" },
  guest: { label: "ผู้เยี่ยมชม (Guest)", description: "เข้าประชุม/เยี่ยมชม เข้าถึงระบบจำกัดตามช่วงเวลา" },
};

type AddableType = "contractor" | "partner" | "guest";

type Step = "type" | "employee-notice" | "identity" | "details" | "done";

const STEP_LABELS = ["ประเภทบุคลากร", "ข้อมูลส่วนตัว", "สิทธิ์และการเข้าถึง", "เสร็จสิ้น"];

const inputClasses =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

function stepIndex(step: Step): number {
  if (step === "type" || step === "employee-notice") return 0;
  if (step === "identity") return 1;
  if (step === "details") return 2;
  return 3;
}

function randomCode(prefix: string): string {
  return `${prefix}-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

interface AddPersonModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (row: PersonnelRow) => void;
}

// "เพิ่มคน" — the generic add-any-type-of-person flow (requirement doc: see
// the "เพิ่มคน / เพิ่มพนักงานใหม่ ต่างกันอย่างไร?" reference diagram, §2/§4).
// Real, client-local state only — added rows aren't persisted, same
// discipline as asset-intelligence/departments's RequestsPage. Picking
// "Employee" doesn't continue this wizard at all — per the diagram's own
// guidance ("ถ้าเป็นพนักงาน ให้ไปที่ 'เข้าใหม่'"), it redirects to
// people/new-hires's AddEmployeeModal instead, since only that flow runs the
// real onboarding process an Employee needs.
export function AddPersonModal({ open, onClose, onAdd }: AddPersonModalProps) {
  const [step, setStep] = useState<Step>("type");
  const [type, setType] = useState<AddableType | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [unit, setUnit] = useState("");
  const [detailA, setDetailA] = useState(""); // contract end / affiliated company / visit purpose
  const [detailB, setDetailB] = useState(""); // (contractor only) contract start
  const [createdName, setCreatedName] = useState("");

  function reset() {
    setStep("type");
    setType(null);
    setName("");
    setEmail("");
    setPosition("");
    setUnit("");
    setDetailA("");
    setDetailB("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function pickType(next: AddablePersonnelType) {
    if (next === "employee") {
      setStep("employee-notice");
      return;
    }
    setType(next);
    setStep("identity");
  }

  function handleConfirm() {
    if (!type) return;
    const prefix = type === "contractor" ? "CON" : "EXT";
    const workStatus: WorkStatus = type === "guest" ? "invited" : "active";
    const row: PersonnelRow = {
      id: `p-new-${Date.now()}`,
      name: name.trim() || "ไม่ระบุชื่อ",
      email: email.trim() || "-",
      employeeCode: randomCode(prefix),
      position: type === "contractor" ? position || "-" : type === "partner" ? "Partner" : detailA || "Guest",
      unit: type === "contractor" ? unit || "-" : type === "partner" ? detailA || "-" : "-",
      type,
      workStatus,
      startDateLabel: type === "contractor" && detailB ? detailB : "-",
      managerName: null,
      managerRole: null,
    };
    onAdd(row);
    setCreatedName(row.name);
    setStep("done");
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="เพิ่มคน"
      size="lg"
      footer={
        step === "type" || step === "employee-notice" || step === "done" ? (
          <Button variant="secondary" onClick={handleClose}>
            {step === "done" ? "ปิด" : "ยกเลิก"}
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={() => setStep(step === "details" ? "identity" : "type")}
            >
              ย้อนกลับ
            </Button>
            {step === "identity" ? (
              <Button variant="primary" onClick={() => setStep("details")} disabled={!name.trim()}>
                ถัดไป
              </Button>
            ) : (
              <Button variant="primary" onClick={handleConfirm}>
                เพิ่ม Person
              </Button>
            )}
          </>
        )
      }
    >
      {step !== "done" && step !== "employee-notice" && (
        <div className="mb-4">
          <WizardSteps steps={STEP_LABELS} currentIndex={stepIndex(step)} />
        </div>
      )}

      {step === "type" && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(Object.keys(TYPE_INFO) as (keyof typeof TYPE_INFO)[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => pickType(key)}
              className="flex flex-col items-start gap-1 rounded-lg border border-zinc-200 p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-zinc-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-500/5"
            >
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{TYPE_INFO[key].label}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{TYPE_INFO[key].description}</span>
            </button>
          ))}
        </div>
      )}

      {step === "employee-notice" && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <UsersIcon className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">พนักงานควรเพิ่มผ่านหน้า &quot;เข้าใหม่&quot;</p>
          <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            การเพิ่มพนักงาน (Employee) ต้องผ่านกระบวนการ Onboarding มาตรฐานให้ครบทุกขั้นตอน — ใช้เมนู
            &quot;เพิ่มพนักงานใหม่&quot; ที่หน้าเข้าใหม่แทน
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Button variant="secondary" onClick={() => setStep("type")}>
              เลือกประเภทอื่น
            </Button>
            <Link
              href="/people/new-hires"
              onClick={handleClose}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              ไปที่หน้าเข้าใหม่
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {step === "identity" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ชื่อ-นามสกุล
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            อีเมล
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
            />
          </label>
        </div>
      )}

      {step === "details" && type === "contractor" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ตำแหน่ง
            <input value={position} onChange={(e) => setPosition(e.target.value)} className={inputClasses} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            หน่วยงาน
            <input value={unit} onChange={(e) => setUnit(e.target.value)} className={inputClasses} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            วันที่เริ่มสัญญา
            <input type="date" value={detailB} onChange={(e) => setDetailB(e.target.value)} className={inputClasses} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            วันที่สิ้นสุดสัญญา
            <input type="date" value={detailA} onChange={(e) => setDetailA(e.target.value)} className={inputClasses} />
          </label>
        </div>
      )}

      {step === "details" && type === "partner" && (
        <div className="grid grid-cols-1 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            บริษัท/องค์กรต้นสังกัด
            <input value={detailA} onChange={(e) => setDetailA(e.target.value)} className={inputClasses} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ขอบเขตการเข้าถึง (Workspace Access)
            <input
              value={detailB}
              onChange={(e) => setDetailB(e.target.value)}
              placeholder="เช่น เฉพาะ Media Workspace"
              className={inputClasses}
            />
          </label>
        </div>
      )}

      {step === "details" && type === "guest" && (
        <div className="grid grid-cols-1 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            วัตถุประสงค์การเยี่ยมชม
            <input
              value={detailA}
              onChange={(e) => setDetailA(e.target.value)}
              placeholder="เช่น ประชุมร่วมกับทีม Product"
              className={inputClasses}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ช่วงเวลาที่เข้าถึงได้
            <input
              value={detailB}
              onChange={(e) => setDetailB(e.target.value)}
              placeholder="เช่น 12 พ.ค. 2569, 09:00–17:00"
              className={inputClasses}
            />
          </label>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">เพิ่ม {createdName} เข้า Organization แล้ว</p>
          <p className="text-xs text-zinc-400">กำหนดประเภทเป็น {type && TYPE_INFO[type].label} และสิทธิ์การเข้าถึงเรียบร้อย</p>
        </div>
      )}
    </Modal>
  );
}

