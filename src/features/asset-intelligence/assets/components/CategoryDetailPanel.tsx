"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { BoxIcon, CheckIcon, MonitorIcon, XIcon } from "@/components/ui/icons";
import { categoryDetail, type CategoryIcon } from "../mock-data";

const iconFor: Record<CategoryIcon, React.ReactNode> = {
  laptop: <MonitorIcon className="h-5 w-5" />,
  desktop: <MonitorIcon className="h-5 w-5" />,
  printer: <BoxIcon className="h-5 w-5" />,
  mobile: <BoxIcon className="h-5 w-5" />,
  tablet: <BoxIcon className="h-5 w-5" />,
  monitor: <MonitorIcon className="h-5 w-5" />,
  furniture: <BoxIcon className="h-5 w-5" />,
  vehicle: <BoxIcon className="h-5 w-5" />,
  ac: <BoxIcon className="h-5 w-5" />,
  projector: <BoxIcon className="h-5 w-5" />,
};

const detailRows: { label: string; value: string }[] = [
  { label: "รหัสประเภท", value: categoryDetail.code },
  { label: "หมวดหลัก", value: categoryDetail.parent },
  { label: "จำนวนทรัพย์สิน", value: `${categoryDetail.assetCount.toLocaleString()} รายการ` },
  { label: "มูลค่ารวม (ราคาทุน)", value: `${categoryDetail.totalValueTHB.toLocaleString()} THB` },
  { label: "มูลค่าคงเหลือ (สุทธิ)", value: `${categoryDetail.netValueTHB.toLocaleString()} THB` },
];

const TABS = ["รายละเอียด", "ทรัพย์สิน"] as const;

export function CategoryDetailPanel() {
  const [active, setActive] = useState<(typeof TABS)[number]>("รายละเอียด");

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            {iconFor[categoryDetail.icon]}
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {categoryDetail.name} ({categoryDetail.nameEn})
            </p>
          </div>
        </div>
        <button title="Not built yet" className="cursor-not-allowed text-t1-gray-400 hover:text-t1-gray-400">
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

      {active === "ทรัพย์สิน" ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border p-8 text-center text-sm text-t1-gray-400">
          ยังไม่มีข้อมูลสำหรับแท็บนี้
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-1.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-foreground">{categoryDetail.status}</span>
          </div>

          <dl className="flex flex-col gap-2.5 text-sm">
            {detailRows.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5">
                <dt className="text-xs text-t1-gray-400">{row.label}</dt>
                <dd className="text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">คำอธิบาย</p>
            <p className="text-sm text-muted-foreground">{categoryDetail.description}</p>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">คุณสมบัติหลัก</p>
            <ul className="flex flex-col gap-1.5">
              {categoryDetail.features.map((feature) => (
                <li key={feature} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4 text-xs text-t1-gray-400">
            <p>วันที่สร้าง: {categoryDetail.createdLabel}</p>
            <p>อัปเดตล่าสุด: {categoryDetail.updatedLabel}</p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <span
              title="Not built yet"
              className="flex cursor-not-allowed items-center justify-center rounded-lg border border-border py-2 text-sm font-semibold text-muted-foreground"
            >
              แก้ไข
            </span>
            <span
              title="Not built yet"
              className="flex cursor-not-allowed items-center justify-center rounded-lg border border-border py-2 text-sm font-semibold text-error"
            >
              ปิดการใช้งาน
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
