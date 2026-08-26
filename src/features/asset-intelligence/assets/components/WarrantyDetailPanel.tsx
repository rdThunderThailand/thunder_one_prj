"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ImageIcon, XIcon } from "@/components/ui/icons";
import { warrantyDetail } from "../mock-data";

const TABS = ["รายละเอียด", "สัญญา / Warranty", "ประวัติเคลม"] as const;

const warrantyInfoRows: { label: string; value: string }[] = [
  { label: "Vendor", value: warrantyDetail.vendor },
  { label: "ประเภทการรับประกัน", value: warrantyDetail.planType },
  { label: "เลขที่สัญญา / โปรแกรม", value: warrantyDetail.contractNumber },
  { label: "วันที่เริ่ม", value: warrantyDetail.startDate },
  { label: "วันหมดอายุ", value: warrantyDetail.expiryDate },
  { label: "ระยะเวลา", value: warrantyDetail.duration },
  { label: "มูลค่าความคุ้มครอง", value: warrantyDetail.coverageValueTHB },
  { label: "ขอบเขตความคุ้มครอง", value: warrantyDetail.coverageScope },
  { label: "เงื่อนไขพิเศษ", value: warrantyDetail.specialTerms },
];

const contactRows: { label: string; value: string; href?: string }[] = [
  { label: "ผู้ให้บริการ", value: warrantyDetail.provider },
  { label: "เบอร์โทร", value: warrantyDetail.phone },
  { label: "อีเมล", value: warrantyDetail.email, href: `mailto:${warrantyDetail.email}` },
  { label: "เว็บไซต์", value: warrantyDetail.website, href: `https://${warrantyDetail.website}` },
];

export function WarrantyDetailPanel() {
  const [active, setActive] = useState<(typeof TABS)[number]>(TABS[1]);

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
            <ImageIcon className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{warrantyDetail.assetTag}</p>
              <Badge variant="pill" color="green">
                {warrantyDetail.status}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{warrantyDetail.assetName}</p>
            <p className="text-xs text-zinc-400">{warrantyDetail.location}</p>
          </div>
        </div>
        <button title="Not built yet" className="cursor-not-allowed text-zinc-300 hover:text-zinc-400">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={`border-b-2 px-0.5 pb-2 text-sm font-medium transition-colors ${
              active === tab
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {active !== TABS[1] ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-400 dark:border-zinc-800">
          ยังไม่มีข้อมูลสำหรับแท็บนี้
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">ข้อมูล Warranty</p>
          <dl className="flex flex-col gap-2.5 text-sm">
            {warrantyInfoRows.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5">
                <dt className="text-xs text-zinc-400">{row.label}</dt>
                <dd className="text-zinc-700 dark:text-zinc-200">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">ข้อมูลการติดต่อ</p>
            <dl className="flex flex-col gap-2.5 text-sm">
              {contactRows.map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5">
                  <dt className="text-xs text-zinc-400">{row.label}</dt>
                  <dd className="text-zinc-700 dark:text-zinc-200">
                    {row.href ? (
                      <a href={row.href} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                        {row.value}
                        <ArrowRightIcon className="h-3 w-3 -rotate-45" />
                      </a>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Quick Action</p>
            <div className="flex gap-2">
              <span
                title="Not built yet"
                className="flex flex-1 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 py-2 text-sm font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
              >
                สร้างเคลมใหม่
              </span>
              <span
                title="Not built yet"
                className="flex flex-1 cursor-not-allowed items-center justify-center rounded-lg bg-indigo-300 py-2 text-sm font-semibold text-white dark:bg-indigo-500/40"
              >
                แก้ไขสัญญา
              </span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
