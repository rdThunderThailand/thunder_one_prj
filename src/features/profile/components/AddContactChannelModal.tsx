"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { InfoIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";

const inputClasses =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const CHANNEL_TYPES = ["โทรศัพท์มือถือ", "LINE", "Microsoft Teams", "WhatsApp", "อื่น ๆ"];
const VISIBILITY_OPTIONS = ["ทุกคนในองค์กร", "เฉพาะฉันและผู้ที่เกี่ยวข้อง", "เฉพาะฉัน"];

/**
 * Matches the mockup's "เพิ่มช่องทางการติดต่อ" form exactly, but there is no
 * contact-channels data model in Core at all (confirmed 2026-09-16 —
 * grepped the whole schema for `contact_channel`/similar, nothing exists):
 * no table for multiple typed channels, no per-channel visibility, no
 * "show on profile" flag. Unlike `EditProfileModal`/`ChangePasswordModal`
 * (which build a real form against a real, if narrow, write path), this
 * form has nowhere at all to submit to — so it always resolves to an
 * honest "ยังไม่พร้อมใช้งาน" state rather than pretending to add a channel
 * that would just vanish on the next page load.
 */
export function AddContactChannelModal({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [channelType, setChannelType] = useState(CHANNEL_TYPES[1]);
  const [value, setValue] = useState("");
  const [visibility, setVisibility] = useState(VISIBILITY_OPTIONS[0]);
  const [showOnProfile, setShowOnProfile] = useState(true);

  if (submitted) {
    return (
      <Modal
        open
        onClose={onClose}
        title="เพิ่มช่องทางการติดต่อ"
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
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">ฟีเจอร์นี้ยังไม่พร้อมใช้งาน</p>
          <p className="max-w-xs text-xs text-zinc-400">
            ระบบจัดการช่องทางการติดต่อหลายรายการยังอยู่ระหว่างการพัฒนา ยังไม่สามารถเพิ่มช่องทางใหม่ได้ในขณะนี้
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="เพิ่มช่องทางการติดต่อ"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" form="add-contact-channel-form" variant="primary">
            เพิ่มช่องทาง
          </Button>
        </>
      }
    >
      <form
        id="add-contact-channel-form"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
        className="flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          ประเภทช่องทาง *
          <select value={channelType} onChange={(e) => setChannelType(e.target.value)} className={inputClasses}>
            {CHANNEL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          ข้อมูล *
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={channelType === "โทรศัพท์มือถือ" ? "เช่น 081-234-5678" : "เช่น username"}
            required
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          การแสดงข้อมูล
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={inputClasses}>
            {VISIBILITY_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={showOnProfile}
            onChange={(e) => setShowOnProfile(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            แสดงข้อมูลนี้ในโปรไฟล์ของฉัน
            <span className="block text-[11px] text-zinc-400">เมื่อเปิดไว้ ผู้อื่นจะเห็นข้อมูลนี้เมื่อดูโปรไฟล์ของคุณ</span>
          </span>
        </label>
      </form>
    </Modal>
  );
}
