"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  CopyIcon,
  InfoIcon,
  LockIcon,
  MonitorIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import type { CoreMe } from "@/features/profile/services/profile-api";
import { ChangePasswordModal } from "./ChangePasswordModal";

interface AccountSecurityPageProps {
  /** Same real `GET /me` data Profile uses — see `../README.md`. */
  me: CoreMe | null;
  tenantName: string | null;
  roleName: string | null;
}

// Same exact hex tokens as ProfilePage (Figma node 341:3520's design
// system) — #e5edf9 borders, #071858 navy, #0760ed link/action blue,
// #6b7a9e secondary text. Kept local rather than shared since only these
// two feature folders use them so far.
const BORDER = "border-[#e5edf9] dark:border-zinc-800";
// Lighter than BORDER on purpose — an internal row divider inside a card
// should read as a quiet separator, not another card edge (Nie, 2026-09-16:
// the divider was too visually heavy).
const DIVIDER = "divide-[#eef2f9] dark:divide-zinc-800";
const TEXT_NAVY = "text-[#071858] dark:text-zinc-50";
const TEXT_MUTED = "text-[#6b7a9e] dark:text-zinc-400";

/**
 * Everything below this component that reads as "unavailable" (MFA status,
 * logged-in devices, login-activity history, account security checklist,
 * phone number) genuinely has no backing anywhere in Core — confirmed
 * 2026-09-16 by grepping every route under `thunder_core_API`'s
 * `api/core/v1/*`: no MFA route, no session/device endpoint, no phone
 * field. The Figma mockup shows all of this fully populated (specific
 * devices, timestamps, an all-green checklist) — matching that exactly
 * would mean fabricating data, the same trap Core's own internal dashboard
 * fell into with a hardcoded session count (see this feature's README).
 * Visual language (colors/icons/card layout) matches the mockup; the
 * *values* for these sections stay honest placeholders instead.
 */
function InertNote({ children }: { children: React.ReactNode }) {
  return (
    <p className={`mt-2 flex items-start gap-2 rounded-lg border p-2.5 text-xs ${BORDER} ${TEXT_MUTED}`}>
      <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {children}
    </p>
  );
}

function ActiveBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
      <CheckCircleIcon className="h-3 w-3" />
      {children}
    </span>
  );
}

export function AccountSecurityPage({ me, tenantName, roleName }: AccountSecurityPageProps) {
  const [changingPassword, setChangingPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  // Real — set only when a change actually succeeds this session (via
  // ChangePasswordModal's onSuccess). Core's password-change response
  // (`{ updated: true }`) carries no timestamp and nothing else tracks one,
  // so "just changed it a moment ago, this session" is the honest scope —
  // stays "-" again after a reload, same as before any change happens.
  const [justChangedPassword, setJustChangedPassword] = useState(false);

  // Same Thai-name preference as ProfilePage/Topbar — keeps this page from
  // showing the English name while everywhere else already switched.
  const thaiName = me ? [me.first_name_th, me.last_name_th].filter(Boolean).join(" ") : "";
  const englishName = me ? [me.first_name, me.last_name].filter(Boolean).join(" ") : "";
  const fullName = me
    ? (me.preferred_language === "th" && thaiName) || englishName || me.display_name || me.email
    : "-";

  async function copyUsername() {
    if (!me?.global_user_code) return;
    try {
      await navigator.clipboard.writeText(me.global_user_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (permissions, insecure context) — no
      // fallback UI needed for a nice-to-have copy button.
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center gap-1.5 text-xs">
        <Link href="/profile" className={`${TEXT_MUTED} hover:text-[#071858] dark:hover:text-zinc-200`}>
          การตั้งค่าส่วนบุคคล
        </Link>
        <span className={TEXT_MUTED}>/</span>
        <span className={`font-semibold ${TEXT_NAVY}`}>บัญชีและความปลอดภัย</span>
      </nav>
      <div>
        <h1 className={`text-xl font-bold ${TEXT_NAVY}`}>บัญชีและความปลอดภัย</h1>
        <p className={`text-sm ${TEXT_MUTED}`}>จัดการบัญชีของคุณ รักษาความปลอดภัย และควบคุมการเข้าถึงข้อมูล</p>
      </div>

      {me === null ? (
        <div className={`rounded-xl border p-10 text-center text-sm ${BORDER} ${TEXT_MUTED}`}>
          ไม่สามารถโหลดข้อมูลบัญชีได้ในขณะนี้
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className={`rounded-xl border bg-white p-5 dark:bg-zinc-900 ${BORDER}`}>
              <div className="flex items-start gap-4">
                {/* Avatar sits on the left only — everything else (name
                    block + the info rows below it) is one right-hand
                    column, not full-width under the avatar too. Sized to
                    1/8 of this card's width (started at 1/4 — too big,
                    halved per Nie, 2026-09-16) via a percentage wrapper +
                    `!w-full !h-full` override, since Avatar's own `size`
                    prop is a fixed pixel value — the `!` (Tailwind
                    important) classes are the one thing that reliably beats
                    that inline style. */}
                <div className="mt-0.5 aspect-square w-[12.5%] shrink-0">
                  <Avatar name={fullName} src={me.avatar_url} size={64} className="!h-full !w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-base font-bold ${TEXT_NAVY}`}>{fullName}</p>
                  {roleName && <p className="text-sm font-medium text-[#0760ed] dark:text-blue-400">{roleName}</p>}
                  <p className={`text-sm ${TEXT_MUTED}`}>{tenantName || "-"}</p>

                  <div className={`mt-3 divide-y ${DIVIDER}`}>
                    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className={TEXT_MUTED}>อีเมลสำหรับเข้าสู่ระบบ</span>
                      <span className="flex items-center gap-2">
                        <span className={`font-semibold ${TEXT_NAVY}`}>{me.email}</span>
                        <ActiveBadge>ใช้งานอยู่</ActiveBadge>
                      </span>
                    </div>
                    {/* Honest placeholder — Core's `/me` has no phone field
                        today (checked directly against the API routes). */}
                    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className={TEXT_MUTED}>หมายเลขโทรศัพท์</span>
                      <span className={`text-xs ${TEXT_MUTED}`}>ยังไม่มีข้อมูลในระบบ</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className={TEXT_MUTED}>รหัสผู้ใช้ (Username)</span>
                      <span className="flex items-center gap-1.5">
                        <span className={`font-semibold ${TEXT_NAVY}`}>{me.global_user_code ?? "-"}</span>
                        {me.global_user_code && (
                          <button
                            type="button"
                            onClick={copyUsername}
                            title="คัดลอก"
                            className={`rounded p-1 ${TEXT_MUTED} hover:bg-zinc-50 hover:text-[#0760ed] dark:hover:bg-zinc-800`}
                          >
                            <CopyIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {copied && <span className="text-[11px] font-medium text-emerald-600">คัดลอกแล้ว</span>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className={TEXT_MUTED}>องค์กรที่สังกัด</span>
                      <span className={`font-semibold ${TEXT_NAVY}`}>{tenantName || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-xl border bg-white p-5 dark:bg-zinc-900 ${BORDER}`}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf4ff] text-[#075df7] dark:bg-blue-500/10 dark:text-blue-400">
                  <LockIcon className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${TEXT_NAVY}`}>รหัสผ่าน</p>
                  <p className={`text-xs ${TEXT_MUTED}`}>เปลี่ยนรหัสผ่านของคุณเป็นประจำ เพื่อความปลอดภัยของบัญชี</p>
                  {/* Honest "-" — Core doesn't expose a password-changed
                      timestamp, and password strength is unknowable to the
                      frontend in principle (it never sees the plaintext). */}
                  <p className={`mt-1 text-xs ${TEXT_MUTED}`}>
                    อัปเดตล่าสุด: {justChangedPassword ? "เมื่อสักครู่" : "-"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setChangingPassword(true)}
                  className="shrink-0 rounded-lg bg-[#0760ed] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0650c4]"
                >
                  เปลี่ยนรหัสผ่าน
                </button>
              </div>
            </div>

            <div className={`rounded-xl border bg-white p-5 dark:bg-zinc-900 ${BORDER}`}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                  <ShieldIcon className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${TEXT_NAVY}`}>การยืนยันตัวตนแบบหลายขั้นตอน (MFA)</p>
                  <p className={`text-xs ${TEXT_MUTED}`}>เพิ่มความปลอดภัยให้กับบัญชีของคุณด้วยการยืนยันตัวตนแบบหลายขั้นตอน</p>
                  <InertNote>ฟีเจอร์นี้ยังไม่พร้อมใช้งาน — ไม่มีการเชื่อมต่อกับระบบยืนยันตัวตนหลายขั้นตอนในขณะนี้</InertNote>
                </div>
                <button
                  type="button"
                  disabled
                  title="ยังไม่พร้อมใช้งาน"
                  className={`shrink-0 cursor-not-allowed rounded-lg border px-3 py-2 text-sm font-semibold ${BORDER} text-[#a8c3f5] dark:text-blue-400/30`}
                >
                  จัดการ MFA
                </button>
              </div>
            </div>

            {/* New — matches the mockup's "อุปกรณ์ที่เข้าสู่ระบบ" section.
                No session/device endpoint exists in Core, so this is an
                honest empty state rather than an invented device list. */}
            <div className={`rounded-xl border bg-white p-5 dark:bg-zinc-900 ${BORDER}`}>
              <div className="mb-1 flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                  <MonitorIcon className="h-4 w-4" />
                </span>
                <h2 className={`text-sm font-bold ${TEXT_NAVY}`}>อุปกรณ์ที่เข้าสู่ระบบ</h2>
              </div>
              <p className={`py-4 text-center text-xs ${TEXT_MUTED}`}>
                ยังไม่สามารถตรวจสอบอุปกรณ์ที่เข้าสู่ระบบบัญชีนี้ได้ในขณะนี้
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className={`rounded-xl border bg-white p-4 dark:bg-zinc-900 ${BORDER}`}>
              <div className="mb-1 flex items-center gap-2">
                <ShieldIcon className={`h-4 w-4 ${TEXT_MUTED}`} />
                <h2 className={`text-sm font-bold ${TEXT_NAVY}`}>สถานะความปลอดภัยของบัญชี</h2>
              </div>
              <InertNote>ยังไม่สามารถตรวจสอบสถานะความปลอดภัยของบัญชีได้ในขณะนี้</InertNote>
            </div>

            <div className={`rounded-xl border bg-white p-4 dark:bg-zinc-900 ${BORDER}`}>
              <div className="mb-1 flex items-center gap-2">
                <ClockIcon className={`h-4 w-4 ${TEXT_MUTED}`} />
                <h2 className={`text-sm font-bold ${TEXT_NAVY}`}>กิจกรรมการเข้าสู่ระบบล่าสุด</h2>
              </div>
              <p className={`py-4 text-center text-xs ${TEXT_MUTED}`}>ยังไม่มีข้อมูลกิจกรรมการเข้าสู่ระบบ</p>
            </div>

            <div className={`rounded-xl border bg-white p-4 dark:bg-zinc-900 ${BORDER}`}>
              <h2 className={`mb-1 text-sm font-bold ${TEXT_NAVY}`}>ความปลอดภัยเพิ่มเติม</h2>
              <ul className={`divide-y ${DIVIDER}`}>
                {["รหัสสำรองสำหรับ MFA", "การแจ้งเตือนด้านความปลอดภัย", "นโยบายความปลอดภัยขององค์กร"].map((label) => (
                  <li
                    key={label}
                    title="ยังไม่พร้อมใช้งาน"
                    className={`flex cursor-not-allowed items-center justify-between gap-2 py-2.5 text-sm ${TEXT_MUTED}`}
                  >
                    {label}
                    <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {changingPassword && (
        <ChangePasswordModal
          onClose={() => setChangingPassword(false)}
          onSuccess={() => setJustChangedPassword(true)}
        />
      )}
    </div>
  );
}
