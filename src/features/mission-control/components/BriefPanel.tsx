"use client";

import Image from "next/image";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  BoxIcon,
  CheckCircleIcon,
  CheckIcon,
  ClipboardIcon,
  InfoIcon,
  ShareNodesIcon,
  SparklesIcon,
  UsersIcon,
  VideoIcon,
  WarningTriangleIcon,
  XIcon,
} from "@/components/ui/icons";

interface BriefPanelProps {
  open: boolean;
  onClose: () => void;
}

// Matches the design reference's 4 corner capability badges around the
// illustration — semantic tones (danger for "needs attention", success for
// "recommended action") rather than the workspace brand colors below.
const CAPABILITIES = [
  { icon: ClipboardIcon, label: "สรุปสิ่งสำคัญ", iconColor: "text-primary", position: "left-0 top-2" },
  { icon: ShareNodesIcon, label: "เห็นบริบทเชื่อมโยง", iconColor: "text-primary", position: "right-0 top-2" },
  { icon: WarningTriangleIcon, label: "ติดตามสิ่งที่ต้องดูแล", iconColor: "text-danger", position: "left-0 bottom-2" },
  { icon: CheckCircleIcon, label: "แนะนำการดำเนินการ", iconColor: "text-success", position: "right-0 bottom-2" },
] as const;

const CHECKLIST = [
  "มีอะไรเปลี่ยนแปลงในองค์กร",
  "เรื่องใดควรให้ความสนใจ",
  "มีอะไรที่เกี่ยวข้องกับคุณ",
  "แนะนำให้ไปดูรายละเอียดที่ไหน",
];

// Same exact tones as WorkspaceCardsRow's People/Asset/Media tiles (this page's
// own workspace-brand colors) — kept literal rather than routed through the
// shared semantic tokens so the identity stays recognizable next to those cards.
const SOURCES = [
  { icon: UsersIcon, label: "People", sub: "บุคลากรและองค์กร", chipBg: "bg-[#e7f2ff]", iconColor: "text-[#075df7]" },
  { icon: BoxIcon, label: "Asset", sub: "ทรัพย์สินและ Thunder Care", chipBg: "bg-[#e5faf0]", iconColor: "text-[#09a96d]" },
  { icon: VideoIcon, label: "Media", sub: "สื่อและจอแสดงผล", chipBg: "bg-[#f1e8ff]", iconColor: "text-[#7117df]" },
];

// Explainer slide-over for the still-in-development Brief feature — opened
// from BriefTeaserCard's "ดูว่า Brief ทำอะไรได้" link. Matches the design
// reference exactly (capability badges + illustration, checklist, supported
// sources, dev-status banner, single acknowledge action); stays honest that
// nothing here is a live feature yet, same as the teaser card it's opened
// from — "รับทราบ" just closes the panel, no state is persisted.
export function BriefPanel({ open, onClose }: BriefPanelProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-modal ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <button
        type="button"
        aria-label="ปิด"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={`absolute inset-0 bg-overlay transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />

      <div
        className={`absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-dialog transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="ThunderOne Brief"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-5">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">ThunderOne Brief</h2>
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
              เร็ว ๆ นี้
            </span>
          </div>
          <button
            type="button"
            aria-label="ปิด"
            tabIndex={open ? 0 : -1}
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
          <h1 className="text-lg font-bold text-foreground">รู้สิ่งสำคัญ ก่อนต้องไปค้นหาเอง</h1>

          <div className="relative h-52 shrink-0">
            {/* Illustration as the background layer (z-0, with a soft color-matched
                glow behind it) — badges are white floating pills on the z-10 layer
                stacked on top, matching the design reference's overlay composition
                rather than a flat tinted box with icon-chip badges around it. */}
            <div className="absolute left-1/2 top-1/2 h-28 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-2xl" />
            <Image
              src="/illustrations/thunderone-brief.png"
              alt=""
              fill
              sizes="400px"
              className="z-0 object-contain p-4"
            />
            <div className="absolute inset-0 z-10 px-1">
              {CAPABILITIES.map(({ icon: Icon, label, iconColor, position }) => {
                const isRight = position.startsWith("right");
                return (
                  <div
                    key={label}
                    className={`absolute flex max-w-[62%] items-center gap-1.5 whitespace-nowrap rounded-full border border-border-subtle bg-card px-3 py-2 shadow-float ${position} ${
                      isRight ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
                    <span className="text-xs font-medium text-foreground">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            ThunderOne Brief จะรวบรวมข้อมูลสำคัญจากทุกพื้นที่ทำงาน เพื่อช่วยให้คุณเห็นภาพรวมองค์กรได้อย่างรวดเร็ว
            และรู้ว่าควรโฟกัสเรื่องใดในวันนี้
          </p>

          <ul className="flex flex-col gap-3 rounded-xl bg-muted p-4">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <CheckIcon className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div>
            <p className="mb-2.5 text-sm font-medium text-muted-foreground">รองรับข้อมูลจาก</p>
            <div className="grid grid-cols-3 gap-2">
              {SOURCES.map(({ icon: Icon, label, sub, chipBg, iconColor }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-border-subtle p-3 text-center">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${chipBg} ${iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-semibold text-foreground">{label}</span>
                  <span className="text-[11px] leading-tight text-muted-foreground">{sub}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-info-soft p-3.5">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-info" />
            <p className="text-xs text-foreground">
              ThunderOne Brief ยังอยู่ระหว่างการพัฒนา เราจะแจ้งให้คุณทราบทันทีเมื่อพร้อมใช้งาน
            </p>
          </div>
        </div>

        <div className="border-t border-border-subtle px-6 py-4">
          <Button onClick={onClose} className="w-full">
            รับทราบ
          </Button>
        </div>
      </div>
    </div>
  );
}
