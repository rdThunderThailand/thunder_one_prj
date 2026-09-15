"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ClockIcon, InfoIcon, LockIcon, ShieldIcon } from "@/components/ui/icons";
import type { CoreMe } from "@/features/profile/services/profile-api";
import { ChangePasswordModal } from "./ChangePasswordModal";

interface AccountSecurityPageProps {
  /** Same real `GET /me` data Profile uses — see `../README.md`. */
  me: CoreMe | null;
  tenantName: string | null;
}

function InertNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
      <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {children}
    </p>
  );
}

export function AccountSecurityPage({ me, tenantName }: AccountSecurityPageProps) {
  const [changingPassword, setChangingPassword] = useState(false);
  const fullName = me ? [me.first_name, me.last_name].filter(Boolean).join(" ") || me.display_name || me.email : "-";

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Link href="/profile" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          การตั้งค่าส่วนบุคคล
        </Link>
        <span>/</span>
        <span className="text-zinc-600 dark:text-zinc-300">บัญชีและความปลอดภัย</span>
      </nav>
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">บัญชีและความปลอดภัย</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">จัดการบัญชีของคุณ รักษาความปลอดภัย และควบคุมการเข้าถึงข้อมูล</p>
      </div>

      {me === null ? (
        <Card className="p-10 text-center text-sm text-zinc-400">ไม่สามารถโหลดข้อมูลบัญชีได้ในขณะนี้</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Card className="p-5">
              <div className="mb-4 flex items-center gap-4">
                <Avatar name={fullName} src={me.avatar_url} size={56} />
                <div>
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{fullName}</p>
                  <p className="text-sm text-zinc-400">{tenantName || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-zinc-400">อีเมลสำหรับเข้าสู่ระบบ</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{me.email}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">รหัสผู้ใช้ (Username)</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{me.global_user_code ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">องค์กรที่สังกัด</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{tenantName || "-"}</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <LockIcon className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">รหัสผ่าน</p>
                  <p className="text-xs text-zinc-400">เปลี่ยนรหัสผ่านของคุณเป็นประจำ เพื่อความปลอดภัยของบัญชี</p>
                  <p className="mt-1 text-xs text-zinc-400">อัปเดตล่าสุด: -</p>
                </div>
                <button
                  type="button"
                  onClick={() => setChangingPassword(true)}
                  className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  เปลี่ยนรหัสผ่าน
                </button>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                  <ShieldIcon className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">การยืนยันตัวตนแบบหลายขั้นตอน (MFA)</p>
                  <p className="text-xs text-zinc-400">เพิ่มความปลอดภัยให้กับบัญชีของคุณด้วยการยืนยันตัวตนแบบหลายขั้นตอน</p>
                  <InertNote>ฟีเจอร์นี้ยังไม่พร้อมใช้งาน — ไม่มีการเชื่อมต่อกับระบบยืนยันตัวตนหลายขั้นตอนในขณะนี้</InertNote>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="p-4">
              <div className="mb-1 flex items-center gap-2">
                <ShieldIcon className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">สถานะความปลอดภัยของบัญชี</h2>
              </div>
              <InertNote>ยังไม่สามารถตรวจสอบสถานะความปลอดภัยของบัญชีได้ในขณะนี้</InertNote>
            </Card>

            <Card className="p-4">
              <div className="mb-1 flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">กิจกรรมการเข้าสู่ระบบล่าสุด</h2>
              </div>
              <p className="py-4 text-center text-xs text-zinc-400">ยังไม่มีข้อมูลกิจกรรมการเข้าสู่ระบบ</p>
            </Card>

            <Card className="p-4">
              <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ความปลอดภัยเพิ่มเติม</h2>
              <ul className="flex flex-col gap-2 text-sm text-zinc-300 dark:text-zinc-600">
                <li title="ยังไม่พร้อมใช้งาน" className="cursor-not-allowed">
                  รหัสสำรองสำหรับ MFA
                </li>
                <li title="ยังไม่พร้อมใช้งาน" className="cursor-not-allowed">
                  การแจ้งเตือนด้านความปลอดภัย
                </li>
                <li title="ยังไม่พร้อมใช้งาน" className="cursor-not-allowed">
                  นโยบายความปลอดภัยของบัญชี
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {changingPassword && <ChangePasswordModal onClose={() => setChangingPassword(false)} />}
    </div>
  );
}
