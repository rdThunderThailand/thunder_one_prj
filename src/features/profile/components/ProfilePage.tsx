"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import {
  ArrowRightIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClipboardIcon,
  ClockIcon,
  CopyIcon,
  EditIcon,
  FolderIcon,
  GridIcon,
  InfoIcon,
  LockIcon,
  PlusIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { formatThaiDate } from "@/lib/thai-date";
import type { CoreMemberRow } from "@/features/people/personnel/services/members-api";
import type { CoreMe } from "../services/profile-api";
import { AddContactChannelModal } from "./AddContactChannelModal";
import { ProfileAvatarEditor } from "./ProfileAvatarEditor";
import { EditPhoneModal } from "./EditPhoneModal";
import { EditProfileModal } from "./EditProfileModal";

type Tab = "personal" | "work" | "contact";

const TABS: { id: Tab; label: string }[] = [
  { id: "personal", label: "ข้อมูลส่วนตัว" },
  { id: "work", label: "การทำงานในองค์กร" },
  { id: "contact", label: "ช่องทางการติดต่อ" },
];

// Exact hex tokens from the Figma profile mockup (node 341:3520) — same
// family as the shell/mission-control redesign (#e5edf9 borders, #071858
// navy, #0760ed link/action blue, #6b7a9e secondary text), not the app's
// generic zinc/indigo defaults. Kept as local constants since this page
// bypasses the shared `Card` (its default `border-zinc-200` can't be
// reliably overridden by an appended className at equal Tailwind
// specificity — same reasoning as HomeStatTilesRow/WorkspaceCardsRow).
const BORDER = "border-[#e5edf9] dark:border-zinc-800";
const TEXT_NAVY = "text-[#071858] dark:text-zinc-50";
const TEXT_MUTED = "text-[#6b7a9e] dark:text-zinc-400";
const TEXT_BLUE = "text-[#0760ed] dark:text-blue-400";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className={TEXT_MUTED}>{label}</span>
      <span className={`font-semibold ${TEXT_NAVY}`}>{value || "-"}</span>
    </div>
  );
}

// Same row shape as `Row`, plus a leading icon — only the work tab uses it.
// `value` falling back to "-" (not a fake number/date) is deliberate for the
// several fields Core's `/me` doesn't return yet: department, team, manager,
// employment type, start date, employment status, employee type. Unlike the
// contact tab's placeholders (which each get their own "ไม่มีข้อมูลในระบบ"
// note), these share one banner below the list instead of nine repeated notes.
function WorkRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className={`flex items-center gap-2.5 ${TEXT_MUTED}`}>
        <span className="text-[#9aabd1] dark:text-zinc-500">{icon}</span>
        {label}
      </span>
      <span className={`font-semibold ${TEXT_NAVY}`}>{value || "-"}</span>
    </div>
  );
}

// "สิทธิ์การเข้าถึง" card rows (work tab) — `value` is always "-" today, same
// honesty reasoning as WorkRow: no roles/permission-groups/workspace-count
// endpoint exists for a self-view yet, so this shows the row shape without
// a made-up number.
function AccessRow({ icon, title, sublabel, value }: { icon: ReactNode; title: string; sublabel: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#0760ed] dark:bg-blue-500/10 dark:text-blue-400">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${TEXT_NAVY}`}>{title}</p>
        <p className={`text-xs ${TEXT_MUTED}`}>{sublabel}</p>
      </div>
      <span className={`shrink-0 text-sm font-semibold ${TEXT_NAVY}`}>{value || "-"}</span>
    </div>
  );
}

// Same row shape as `Row`, plus an optional "หลัก" (primary) badge and a
// small trailing note (e.g. "ไม่สามารถแก้ไขได้") — used by the contact tab,
// which is the only place either shows up in this page.
function ContactRow({ label, value, badge, note }: { label: string; value: string; badge?: string; note?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className={TEXT_MUTED}>{label}</span>
      <span className="flex items-center gap-2">
        <span className={`font-semibold ${TEXT_NAVY}`}>{value}</span>
        {badge && (
          <span className="inline-flex shrink-0 items-center rounded-full bg-[#eaf4ff] px-2 py-0.5 text-[11px] font-semibold text-[#075df7] dark:bg-blue-500/10 dark:text-blue-400">
            {badge}
          </span>
        )}
        {note && <span className={`shrink-0 text-[11px] ${TEXT_MUTED}`}>{note}</span>}
      </span>
    </div>
  );
}

function EditButton({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "ยังไม่รองรับการแก้ไข" : undefined}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${BORDER} ${
        disabled ? "cursor-not-allowed text-[#a8c3f5] dark:text-blue-400/30" : `bg-white hover:bg-[#f5f9ff] dark:bg-transparent dark:hover:bg-zinc-800 ${TEXT_BLUE}`
      }`}
    >
      <EditIcon className="h-3.5 w-3.5" />
      แก้ไข
    </button>
  );
}

interface ProfilePageProps {
  /** Real since 2026-09-16 — Core's `GET /me` (`../services/profile-api.ts`).
   *  `null` when the fetch failed or no session/tenant resolved — same
   *  explicit-error-state discipline as every other feature in this app. */
  me: CoreMe | null;
  tenantName: string | null;
  roleName: string | null;
  /** Real since 2026-09-22 — `../services/profile-api.ts`'s `getMyMembership`
   *  (a `GET /tenants/:id/members?search=` lookup, not a dedicated
   *  self-service endpoint — see that function's own doc comment). `null`
   *  when the lookup failed/found no match; every WorkRow below falls back
   *  to "-" the same way `Row` already does elsewhere on this page. */
  membership: CoreMemberRow | null;
  /** Real since 2026-09-22 — resolved from `membership.default_department_id`
   *  against `GET /tenants/:id/organizations` (page.tsx's `findDepartmentName`).
   *  `null` when there's no department set or the org tree fetch failed. */
  departmentName: string | null;
}

const LANGUAGE_LABEL: Record<string, string> = { th: "ไทย", en: "English" };

// Same wording as people/personnel/components/PersonnelFilterBar.tsx's
// TYPE_LABEL/STATUS_LABEL — this page and Personnel's roster describe the
// same Core membership row, so the Thai labels should read identically
// rather than drifting into a second vocabulary for the same 5-6 values.
const MEMBER_TYPE_LABEL: Record<NonNullable<CoreMemberRow["member_type"]>, string> = {
  employee: "พนักงาน",
  contractor: "ผู้รับเหมา",
  partner: "พันธมิตร",
  guest: "แขก",
};
const MEMBERSHIP_STATUS_LABEL: Record<CoreMemberRow["status"], string> = {
  invited: "เชิญแล้ว",
  active: "ทำงานอยู่",
  suspended: "ลาหยุด",
  removed: "พ้นสภาพ",
  archived: "พ้นสภาพ",
};
const JOB_TYPE_LABEL: Record<NonNullable<CoreMemberRow["job_type"]>, string> = {
  full_time: "เต็มเวลา",
  part_time: "พาร์ทไทม์",
};

export function ProfilePage({ me, tenantName, roleName, membership, departmentName }: ProfilePageProps) {
  const [tab, setTab] = useState<Tab>("personal");
  const [editing, setEditing] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [addingChannel, setAddingChannel] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Prefer the Thai name when `preferred_language` is "th" and one is
  // actually set — matches the "TH" the Topbar already shows for this
  // account (real `preferred_language`, not the language-switcher itself,
  // which is still decorative — see Topbar's own comment). Nie, 2026-09-16:
  // entered a Thai name and it kept showing the English one regardless.
  const thaiName = me ? [me.first_name_th, me.last_name_th].filter(Boolean).join(" ") : "";
  const englishName = me ? [me.first_name, me.last_name].filter(Boolean).join(" ") : "";
  const fullName = me
    ? (me.preferred_language === "th" && thaiName) || englishName || me.display_name || me.email
    : "-";

  async function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — no fallback UI needed for a
      // nice-to-have copy button.
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Link href="/mission-control" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          หน้าแรก
        </Link>
        <span>/</span>
        <span className="text-zinc-600 dark:text-zinc-300">โปรไฟล์ของฉัน</span>
      </nav>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">โปรไฟล์ของฉัน</h1>

      {me === null ? (
        <Card className={`border p-10 text-center text-sm ${BORDER} ${TEXT_MUTED}`}>ไม่สามารถโหลดข้อมูลโปรไฟล์ได้ในขณะนี้</Card>
      ) : (
        <>
          <div className={`flex items-center gap-4 rounded-xl border bg-white p-6 dark:bg-zinc-900 ${BORDER}`}>
            <ProfileAvatarEditor
              name={fullName}
              avatarUrl={me.avatar_url}
            />
            <div>
              <p className={`text-xl font-bold ${TEXT_NAVY}`}>{fullName}</p>
              <p className={`text-sm font-medium ${TEXT_BLUE}`}>{roleName || "-"}</p>
              <p className={`text-sm ${TEXT_NAVY}`}>{tenantName || "-"}</p>
            </div>
          </div>

          <div className={`flex gap-1 border-b ${BORDER}`}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                  tab === t.id ? `border-[#0760ed] ${TEXT_BLUE}` : `border-transparent ${TEXT_MUTED} hover:text-[#071858] dark:hover:text-zinc-200`
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* One continuous card for ข้อมูลส่วนตัว + เกี่ยวกับฉัน (personal
                tab only) — the mockup has them as one bordered box with an
                internal divider, not two separate cards with a gap between
                them. */}
            <div className={`rounded-xl border bg-white p-5 dark:bg-zinc-900 lg:col-span-2 ${BORDER}`}>
              {tab === "personal" && (
                <>
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className={`text-sm font-bold ${TEXT_NAVY}`}>ข้อมูลส่วนตัว</h2>
                    <EditButton onClick={() => setEditing(true)} />
                  </div>
                  <div className="divide-y divide-[#e5edf9] dark:divide-zinc-800">
                    <Row label="ชื่อ - นามสกุล" value={fullName} />
                    <Row label="ชื่อที่ใช้แสดง" value={me.display_name ?? ""} />
                    {/* Real since 2026-09-16 (Core commit d33d21a) — was a
                        placeholder before Core added date_of_birth to
                        GET /me's select. */}
                    <Row label="วันเดือนปีเกิด" value={me.date_of_birth ? formatThaiDate(me.date_of_birth) : ""} />
                    <Row
                      label="ภาษา"
                      value={me.preferred_language ? (LANGUAGE_LABEL[me.preferred_language] ?? me.preferred_language) : ""}
                    />
                  </div>

                  {/* No bio/"about me" field exists on Core's `/me` today,
                      so this stays an honest empty state — edit is disabled
                      rather than faked. */}
                  <div className={`mt-4 border-t pt-4 ${BORDER}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <h2 className={`text-sm font-bold ${TEXT_NAVY}`}>เกี่ยวกับฉัน</h2>
                      <EditButton disabled />
                    </div>
                    <p className={`text-sm ${TEXT_MUTED}`}>ยังไม่มีข้อมูลแนะนำตัวในระบบ</p>
                  </div>
                </>
              )}
              {tab === "work" && (
                <>
                  <h2 className={`mb-1 text-sm font-bold ${TEXT_NAVY}`}>ข้อมูลการทำงาน</h2>
                  <div className="divide-y divide-[#e5edf9] dark:divide-zinc-800">
                    <WorkRow icon={<BuildingIcon className="h-4 w-4" />} label="องค์กร" value={tenantName ?? ""} />
                    <WorkRow icon={<ClipboardIcon className="h-4 w-4" />} label="ตำแหน่ง" value={roleName ?? ""} />
                    {/* Real since 2026-09-22 via `membership` (see ProfilePageProps'
                        own doc comment for where it comes from) — "ทีม" and
                        "ผู้บังคับบัญชา" stay honest "-" placeholders: Core has
                        no "team" concept distinct from department, and while a
                        department's `manager_id` does exist, resolving it to a
                        name needs the admin-only member-applications lookup,
                        which this self-view can't call. */}
                    <WorkRow icon={<FolderIcon className="h-4 w-4" />} label="แผนก" value={departmentName ?? ""} />
                    <WorkRow icon={<UsersIcon className="h-4 w-4" />} label="ทีม" value="" />
                    <WorkRow icon={<UserIcon className="h-4 w-4" />} label="ผู้บังคับบัญชา" value="" />
                    <WorkRow
                      icon={<ClockIcon className="h-4 w-4" />}
                      label="รูปแบบการทำงาน"
                      value={membership?.job_type ? JOB_TYPE_LABEL[membership.job_type] : ""}
                    />
                    <WorkRow
                      icon={<CalendarIcon className="h-4 w-4" />}
                      label="วันที่เริ่มงาน"
                      value={membership?.start_date ? formatThaiDate(membership.start_date) : ""}
                    />
                    <WorkRow
                      icon={<CheckCircleIcon className="h-4 w-4" />}
                      label="สถานะการทำงาน"
                      value={membership ? MEMBERSHIP_STATUS_LABEL[membership.status] : ""}
                    />
                    <WorkRow
                      icon={<UserIcon className="h-4 w-4" />}
                      label="ประเภทพนักงาน"
                      value={membership?.member_type ? MEMBER_TYPE_LABEL[membership.member_type] : ""}
                    />
                  </div>
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#eff5ff] p-3 text-xs text-[#071858] dark:bg-blue-500/10 dark:text-zinc-300">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0760ed] text-white">
                      <InfoIcon className="h-3 w-3" />
                    </span>
                    <span>ข้อมูลนี้จัดการโดยองค์กร หากต้องการแก้ไข กรุณาติดต่อฝ่ายบุคคล (People Workspace)</span>
                  </p>
                </>
              )}
              {tab === "contact" && (
                <>
                  <div className="mb-1 flex items-center gap-2">
                    <h2 className={`text-sm font-bold ${TEXT_NAVY}`}>ข้อมูลติดต่อจากองค์กร (Work Contact)</h2>
                    <span
                      className={`text-[11px] ${TEXT_MUTED}`}
                      title="ข้อมูลนี้จัดการโดยฝ่ายบุคคลผ่าน People Workspace"
                    >
                      จัดการโดยองค์กร
                    </span>
                  </div>
                  <div className="divide-y divide-[#e5edf9] dark:divide-zinc-800">
                    <ContactRow label="อีเมลงาน" value={me.email} badge="หลัก" note="ไม่สามารถแก้ไขได้" />
                    {/* Honest placeholders — these aren't the personal
                        `phone`/`address` columns below (that's real, see
                        the Personal Contact section); an org-managed office
                        phone/extension/address concept doesn't exist
                        anywhere in Core's schema (checked directly), not on
                        the user row and not on the tenant row either. */}
                    <ContactRow label="โทรศัพท์สำนักงาน" value="-" note="ไม่มีข้อมูลในระบบ" />
                    <ContactRow label="เบอร์ต่อภายใน" value="-" note="ไม่มีข้อมูลในระบบ" />
                    <ContactRow label="ที่อยู่สำนักงาน" value="-" note="ไม่มีข้อมูลในระบบ" />
                  </div>

                  <div className={`mt-4 border-t pt-4 ${BORDER}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <h2 className={`text-sm font-bold ${TEXT_NAVY}`}>ข้อมูลติดต่อส่วนตัว (Personal Contact)</h2>
                      <EditButton onClick={() => setEditingPhone(true)} />
                    </div>
                    <div className="divide-y divide-[#e5edf9] dark:divide-zinc-800">
                      {/* Real since 2026-09-16 (Core commit d33d21a). */}
                      <ContactRow
                        label="โทรศัพท์มือถือ"
                        value={me.phone ?? "ยังไม่มีข้อมูลในระบบ"}
                        badge={me.phone ? "หลัก" : undefined}
                      />
                      {/* No multi-channel contact system exists in Core —
                          only the one flat `phone` column. LINE (and any
                          other channel type) has nowhere to be stored, so
                          this stays honest rather than pretending to have
                          one. */}
                      <ContactRow label="LINE" value="ยังไม่มีข้อมูลในระบบ" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddingChannel(true)}
                      className={`mt-3 flex items-center gap-1.5 text-sm font-semibold ${TEXT_BLUE}`}
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      เพิ่มช่องทางการติดต่อ
                    </button>
                  </div>
                </>
              )}
            </div>

            {tab === "contact" ? (
              <div className="flex flex-col gap-4">
                <div className={`rounded-xl border bg-white p-5 dark:bg-zinc-900 ${BORDER}`}>
                  <h2 className={`text-sm font-bold ${TEXT_NAVY}`}>การแสดงข้อมูล</h2>
                  <p className={`mb-2 text-xs ${TEXT_MUTED}`}>กำหนดว่าใครสามารถเห็นข้อมูลการติดต่อของคุณได้</p>
                  {/* No visibility/privacy-permission system exists for
                      contact info in Core — these stay inert rather than
                      claiming a saved value ("ทุกคนในองค์กร") that was
                      never actually set anywhere. */}
                  <div className="divide-y divide-[#e5edf9] dark:divide-zinc-800">
                    {["วันเกิด", "เบอร์โทรศัพท์มือถือ", "LINE"].map((label) => (
                      <div key={label} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span className={TEXT_MUTED}>{label}</span>
                        <span
                          className={`flex cursor-not-allowed items-center gap-1 text-xs ${TEXT_MUTED}`}
                          title="ยังไม่รองรับการตั้งค่าความเป็นส่วนตัวสำหรับข้อมูลติดต่อ"
                        >
                          ยังไม่พร้อมใช้งาน
                          <ChevronDownIcon className="h-3 w-3 opacity-50" />
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#eff5ff] p-3 text-xs text-[#071858] dark:bg-blue-500/10 dark:text-zinc-300">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0760ed] text-white">
                      <InfoIcon className="h-3 w-3" />
                    </span>
                    <span>
                      ข้อมูลการติดต่อบางรายการถูกกำหนดโดยองค์กร หากต้องการเปลี่ยนแปลงข้อมูลติดต่อที่จัดการโดยองค์กร กรุณาติดต่อฝ่ายบุคคล
                      (People Workspace)
                    </span>
                  </p>
                </div>

                <div className={`rounded-xl border bg-white p-5 dark:bg-zinc-900 ${BORDER}`}>
                  <h2 className={`text-sm font-bold ${TEXT_NAVY}`}>ช่องทางการติดต่อด่วน</h2>
                  <p className={`mb-3 text-xs ${TEXT_MUTED}`}>คัดลอกข้อมูลเพื่อใช้งานอย่างรวดเร็ว</p>
                  <div className="flex flex-col gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(me.email, setCopiedEmail)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium ${BORDER} ${TEXT_NAVY} hover:bg-[#f5f9ff] dark:hover:bg-zinc-800`}
                      >
                        คัดลอกอีเมลงาน
                        <CopyIcon className="h-3.5 w-3.5" />
                      </button>
                      {copiedEmail && <p className="mt-1 text-[11px] font-medium text-emerald-600">คัดลอกแล้ว</p>}
                    </div>
                    <div>
                      <button
                        type="button"
                        disabled={!me.phone}
                        onClick={() => me.phone && copyToClipboard(me.phone, setCopiedPhone)}
                        title={!me.phone ? "ยังไม่มีข้อมูลเบอร์โทรศัพท์" : undefined}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium ${BORDER} ${
                          me.phone ? `${TEXT_NAVY} hover:bg-[#f5f9ff] dark:hover:bg-zinc-800` : "cursor-not-allowed text-[#a8c3f5] dark:text-blue-400/30"
                        }`}
                      >
                        คัดลอกเบอร์มือถือ
                        <CopyIcon className="h-3.5 w-3.5" />
                      </button>
                      {copiedPhone && <p className="mt-1 text-[11px] font-medium text-emerald-600">คัดลอกแล้ว</p>}
                    </div>
                  </div>
                </div>
              </div>
            ) : tab === "work" ? (
              <div className="flex flex-col gap-4">
                <div className={`rounded-xl border bg-white p-5 dark:bg-zinc-900 ${BORDER}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className={`text-sm font-bold ${TEXT_NAVY}`}>โครงสร้างในองค์กร</h2>
                    <Link href="/people/org-structure" className={`flex items-center gap-1 text-xs font-semibold ${TEXT_BLUE}`}>
                      ดูโครงสร้างองค์กร
                      <ArrowRightIcon className="h-3 w-3" />
                    </Link>
                  </div>
                  {/* Org → [department, if resolved] → you. Only real levels
                      — "team" doesn't exist as a Core concept, so it never
                      gets a rung here. The full real chart is one click away
                      via the link above. */}
                  <div className={`flex items-center gap-2 text-sm font-semibold ${TEXT_NAVY}`}>
                    <BuildingIcon className="h-4 w-4 shrink-0 text-[#9aabd1] dark:text-zinc-500" />
                    <span className="truncate">{tenantName ?? "-"}</span>
                  </div>
                  <div className="ml-2 mt-2 border-l border-[#e5edf9] pl-4 dark:border-zinc-800">
                    {departmentName && (
                      <div className={`mb-2 flex items-center gap-2 text-sm font-medium ${TEXT_NAVY}`}>
                        <FolderIcon className="h-4 w-4 shrink-0 text-[#9aabd1] dark:text-zinc-500" />
                        <span className="truncate">{departmentName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 rounded-lg bg-[#eaf1ff] px-3 py-2 dark:bg-blue-500/10">
                      <UserIcon className="h-4 w-4 shrink-0 text-[#0760ed] dark:text-blue-400" />
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-semibold ${TEXT_NAVY}`}>{fullName}</p>
                        <p className={`truncate text-xs ${TEXT_MUTED}`}>{roleName ?? "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl border bg-white p-5 dark:bg-zinc-900 ${BORDER}`}>
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className={`text-sm font-bold ${TEXT_NAVY}`}>สิทธิ์การเข้าถึง</h2>
                    {/* No roles/permission-groups/workspace-count endpoint
                        exists for a self-view yet — inert, same reasoning as
                        ActivityFeedCard's "ดูทั้งหมด" (no page to link to). */}
                    <button type="button" className={`flex items-center gap-1 text-xs font-semibold ${TEXT_BLUE}`}>
                      ดูทั้งหมด
                      <ArrowRightIcon className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="divide-y divide-[#e5edf9] dark:divide-zinc-800">
                    <AccessRow icon={<GridIcon className="h-4 w-4" />} title="Workspace Access" sublabel="พื้นที่ทำงานที่สามารถเข้าถึงได้" value="" />
                    <AccessRow icon={<ShieldIcon className="h-4 w-4" />} title="บทบาท (Roles)" sublabel="บทบาทในระบบ" value="" />
                    <AccessRow icon={<LockIcon className="h-4 w-4" />} title="กลุ่มสิทธิ์ (Permission Groups)" sublabel="กลุ่มสิทธิ์ที่ได้รับ" value="" />
                  </div>
                </div>
              </div>
            ) : (
              <div className={`rounded-xl border bg-white p-5 dark:bg-zinc-900 ${BORDER}`}>
                <div className="mb-1 flex items-center justify-between">
                  <h2 className={`text-sm font-bold ${TEXT_NAVY}`}>รูปแบบการแสดงผล</h2>
                  <EditButton disabled />
                </div>
                <div className="divide-y divide-[#e5edf9] dark:divide-zinc-800">
                  <Row
                    label="ภาษาในระบบ"
                    value={me.preferred_language ? (LANGUAGE_LABEL[me.preferred_language] ?? me.preferred_language) : ""}
                  />
                  <Row label="โซนเวลา (Timezone)" value={me.timezone ?? ""} />
                </div>
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#eff5ff] p-3 text-xs text-[#071858] dark:bg-blue-500/10 dark:text-zinc-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0760ed] text-white">
                    <InfoIcon className="h-3 w-3" />
                  </span>
                  <span>
                    การตั้งค่าการใช้งานอื่น ๆ เช่น การแจ้งเตือน และธีม สามารถจัดการได้ที่{" "}
                    <Link href="/account-security" className={`font-semibold ${TEXT_BLUE}`}>
                      การตั้งค่าส่วนบุคคล
                    </Link>
                  </span>
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {editing && me && (
        <EditProfileModal
          userId={me.id}
          firstName={me.first_name ?? ""}
          lastName={me.last_name ?? ""}
          firstNameTh={me.first_name_th ?? ""}
          lastNameTh={me.last_name_th ?? ""}
          dateOfBirth={me.date_of_birth ?? ""}
          onClose={() => setEditing(false)}
        />
      )}
      {editingPhone && me && (
        <EditPhoneModal userId={me.id} phone={me.phone ?? ""} onClose={() => setEditingPhone(false)} />
      )}
      {addingChannel && <AddContactChannelModal onClose={() => setAddingChannel(false)} />}
    </div>
  );
}
