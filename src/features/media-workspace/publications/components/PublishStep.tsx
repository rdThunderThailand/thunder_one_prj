"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, ClockIcon, InfoIcon, PaperPlaneIcon } from "@/components/ui/icons";
import type { ChannelListItem } from "../../channels/types";
import type { MediaAsset } from "../types";
import { utcToZonedParts } from "../schedule";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { ProgramSummaryRail } from "./ProgramSummaryRail";

export function PublishStep({ channels, assets, canPublish }: { channels: ChannelListItem[]; assets: MediaAsset[]; canPublish: boolean }) {
  const basicInfo = usePublicationDraftStore((state) => state.basicInfo);
  const schedule = usePublicationDraftStore((state) => state.scheduleForm);
  const now = utcToZonedParts(new Date().toISOString(), schedule.timezone);
  const starts = schedule.schedule_type === "now" ? "Starts immediately after publishing" : `${schedule.start_date}, ${schedule.start_time}`;

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-xl font-extrabold tracking-tight text-foreground">Step 5 — Publish</h1><p className="mt-0.5 text-sm text-muted-foreground">ยืนยันและเผยแพร่</p></div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex flex-col gap-6">
          <Card className={`flex items-center gap-5 border p-6 ${canPublish ? "border-success/30 bg-success-soft" : "border-warning/30 bg-warning-soft"}`}>
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${canPublish ? "bg-success text-white" : "bg-warning-soft text-warning"}`}><CheckCircleIcon className="h-7 w-7" /></span>
            <div><h2 className="text-lg font-semibold text-foreground">{canPublish ? "พร้อมเผยแพร่!" : "ยังไม่พร้อมเผยแพร่"}</h2><p className="mt-1 text-sm text-muted-foreground">{canPublish ? `โปรแกรม ${basicInfo.name || "นี้"} พร้อมเผยแพร่แล้ว` : "กลับไป Review และแก้รายการที่ยังไม่ผ่านก่อน"}</p></div>
            <PaperPlaneIcon className="ml-auto hidden h-12 w-12 text-primary sm:block" />
          </Card>

          <div><h2 className="text-[11px] font-bold text-foreground">Publish Options</h2><p className="text-xs text-muted-foreground">ตัวเลือกการเผยแพร่</p><div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2"><Card className="border-primary/30 bg-primary-soft p-5 ring-1 ring-primary/30"><div className="flex items-start gap-3"><span className="mt-1 h-4 w-4 rounded-full border-4 border-primary" /><div><p className="text-sm font-semibold text-foreground">Publish Now</p><p className="text-xs text-muted-foreground">เผยแพร่รายการนี้ด้วยกำหนดการที่ตั้งไว้</p><p className="mt-3 text-xs font-medium text-primary">{starts}</p></div></div></Card><Card className="p-5"><div className="flex items-start gap-3"><ClockIcon className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-sm font-semibold text-foreground">Program schedule</p><p className="text-xs text-muted-foreground">กำหนดจาก Step 3</p><dl className="mt-3 space-y-1 text-xs text-muted-foreground"><div className="flex justify-between gap-3"><dt>Start</dt><dd>{schedule.schedule_type === "now" ? `${now.date}, ${now.time}` : `${schedule.start_date}, ${schedule.start_time}`}</dd></div><div className="flex justify-between gap-3"><dt>End</dt><dd>{schedule.end_date ? `${schedule.end_date}, ${schedule.end_time}` : "No end date"}</dd></div><div className="flex justify-between gap-3"><dt>Timezone</dt><dd>{schedule.timezone}</dd></div></dl></div></div></Card></div></div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><DisabledOptions title="Notifications (optional)" items={["Email Notification", "System Notification"]} /><DisabledOptions title="Permissions" items={["Allow editing after publish", "Lock after publish"]} /></div>
        </div>

        <div className="flex flex-col gap-4"><ProgramSummaryRail channels={channels} assets={assets} title="Publish Summary" subtitle="สรุปโปรแกรมพร้อมเผยแพร่" /><Card className="p-4"><p className="flex items-start gap-2 text-xs text-primary"><InfoIcon className="h-4 w-4 shrink-0" />หลังจากเผยแพร่ คุณสามารถติดตามกำหนดการได้ที่ <Link href="/media-workspace/publications" className="font-semibold underline">Now &amp; Next</Link></p></Card></div>
      </div>
    </div>
  );
}

function DisabledOptions({ title, items }: { title: string; items: string[] }) { return <Card className="p-5"><h2 className="text-[11px] font-bold text-foreground">{title}</h2><p className="text-xs text-muted-foreground">ยังไม่เปิดใช้งาน</p><div className="mt-4 space-y-3 opacity-50">{items.map((item) => <label key={item} className="flex cursor-not-allowed items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" disabled className="h-4 w-4" />{item}</label>)}</div></Card>; }
