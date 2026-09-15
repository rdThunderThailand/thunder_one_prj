"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EditIcon } from "@/components/ui/icons";
import type { CoreMe } from "../services/profile-api";
import { EditProfileModal } from "./EditProfileModal";

type Tab = "personal" | "work" | "contact";

const TABS: { id: Tab; label: string }[] = [
  { id: "personal", label: "ข้อมูลส่วนตัว" },
  { id: "work", label: "การทำงานในองค์กร" },
  { id: "contact", label: "ช่องทางการติดต่อ" },
];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-50">{value || "-"}</span>
    </div>
  );
}

interface ProfilePageProps {
  /** Real since 2026-09-16 — Core's `GET /me` (`../services/profile-api.ts`).
   *  `null` when the fetch failed or no session/tenant resolved — same
   *  explicit-error-state discipline as every other feature in this app. */
  me: CoreMe | null;
  tenantName: string | null;
  roleName: string | null;
}

const LANGUAGE_LABEL: Record<string, string> = { th: "ไทย", en: "English" };

export function ProfilePage({ me, tenantName, roleName }: ProfilePageProps) {
  const [tab, setTab] = useState<Tab>("personal");
  const [editing, setEditing] = useState(false);

  const fullName = me ? [me.first_name, me.last_name].filter(Boolean).join(" ") || me.display_name || me.email : "-";

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
        <Card className="p-10 text-center text-sm text-zinc-400">ไม่สามารถโหลดข้อมูลโปรไฟล์ได้ในขณะนี้</Card>
      ) : (
        <>
          <Card className="flex items-center gap-4 p-5">
            <Avatar name={fullName} src={me.avatar_url} size={64} />
            <div>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{fullName}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{roleName || "-"}</p>
              <p className="text-sm text-zinc-400">{tenantName || "-"}</p>
            </div>
          </Card>

          <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              {tab === "personal" && (
                <>
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ข้อมูลส่วนตัว</h2>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <EditIcon className="h-3.5 w-3.5" />
                      แก้ไข
                    </button>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    <Row label="ชื่อ - นามสกุล" value={fullName} />
                    <Row label="ชื่อที่ใช้แสดง" value={me.display_name ?? ""} />
                    <Row label="อีเมล" value={me.email} />
                  </div>
                </>
              )}
              {tab === "work" && (
                <>
                  <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">การทำงานในองค์กร</h2>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    <Row label="บทบาท" value={roleName ?? ""} />
                    <Row label="องค์กร" value={tenantName ?? ""} />
                  </div>
                </>
              )}
              {tab === "contact" && (
                <>
                  <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ช่องทางการติดต่อ</h2>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    <Row label="อีเมล" value={me.email} />
                    <Row label="เบอร์โทรศัพท์" value="" />
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">ยังไม่มีข้อมูลเบอร์โทรศัพท์ในระบบ</p>
                </>
              )}
            </Card>

            <Card className="p-5">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">รูปแบบการแสดงผล</h2>
                <button
                  type="button"
                  disabled
                  title="ยังไม่รองรับการแก้ไข"
                  className="cursor-not-allowed rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-300 dark:border-zinc-700 dark:text-zinc-600"
                >
                  แก้ไข
                </button>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <Row
                  label="ภาษาในระบบ"
                  value={me.preferred_language ? (LANGUAGE_LABEL[me.preferred_language] ?? me.preferred_language) : ""}
                />
                <Row label="โซนเวลา (Timezone)" value={me.timezone ?? ""} />
              </div>
              <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
                การตั้งค่าการใช้งานอื่น ๆ เช่น การแจ้งเตือน และธีม สามารถจัดการได้ที่{" "}
                <Link href="/account-security" className="font-medium text-indigo-600 dark:text-indigo-400">
                  การตั้งค่าส่วนบุคคล
                </Link>
              </p>
            </Card>
          </div>
        </>
      )}

      {editing && me && (
        <EditProfileModal
          userId={me.id}
          firstName={me.first_name ?? ""}
          lastName={me.last_name ?? ""}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
