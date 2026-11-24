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
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-t1-gray-400">
            <ImageIcon className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{warrantyDetail.assetTag}</p>
              <Badge variant="pill" color="green">
                {warrantyDetail.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{warrantyDetail.assetName}</p>
            <p className="text-xs text-t1-gray-400">{warrantyDetail.location}</p>
          </div>
        </div>
        <button title="Not built yet" className="cursor-not-allowed text-t1-gray-400 hover:text-muted-foreground">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 flex items-center gap-4 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={`border-b-2 px-0.5 pb-2 text-sm font-medium transition-colors ${
              active === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {active !== TABS[1] ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border p-8 text-center text-sm text-t1-gray-400">
          ยังไม่มีข้อมูลสำหรับแท็บนี้
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">ข้อมูล Warranty</p>
          <dl className="flex flex-col gap-2.5 text-sm">
            {warrantyInfoRows.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5">
                <dt className="text-xs text-t1-gray-400">{row.label}</dt>
                <dd className="text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">ข้อมูลการติดต่อ</p>
            <dl className="flex flex-col gap-2.5 text-sm">
              {contactRows.map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5">
                  <dt className="text-xs text-t1-gray-400">{row.label}</dt>
                  <dd className="text-foreground">
                    {row.href ? (
                      <a href={row.href} className="flex items-center gap-1 text-primary hover:text-accent-foreground">
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
            <p className="text-xs font-semibold uppercase tracking-wide text-t1-gray-400">Quick Action</p>
            <div className="flex gap-2">
              <span
                title="Not built yet"
                className="flex flex-1 cursor-not-allowed items-center justify-center rounded-lg border border-border py-2 text-sm font-semibold text-muted-foreground"
              >
                สร้างเคลมใหม่
              </span>
              <span
                title="Not built yet"
                className="flex flex-1 cursor-not-allowed items-center justify-center rounded-lg bg-t1-blue-300 py-2 text-sm font-semibold text-primary-foreground"
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
