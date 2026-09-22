"use client";

import Image from "next/image";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, SparklesIcon } from "@/components/ui/icons";
import { briefTeaser } from "../mock-data";
import { BriefPanel } from "./BriefPanel";

// A static teaser for an AI-style summary panel — no assistant/insights
// backend exists anywhere in this app, same honest-preview treatment the
// retired AskThunderOneCard used. "ดูว่า Brief ทำอะไรได้" opens BriefPanel,
// an explainer of what the feature will do once built — it doesn't turn the
// feature itself on (see BriefPanel's own doc comment).
//
// 3-column layout matches the Figma mockup exactly (node 396:4560): title
// block, illustration, promo text + button — rebuilt 2026-09-16 from the
// earlier 2-column version, which dropped the illustration and put the
// button in the wrong column. The illustration is the mockup's own
// decorative artwork (downloaded from Figma's asset export, not a stock
// photo standing in for real data — see public/illustrations).
export function BriefTeaserCard() {
  const [briefOpen, setBriefOpen] = useState(false);

  return (
    <Card className="flex flex-col items-stretch gap-4 p-5 lg:flex-row lg:items-center">
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ThunderOne Brief</h2>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            เร็ว ๆ นี้
          </span>
        </div>
        <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">ภาพรวมสำคัญขององค์กรในที่เดียว</p>
        <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">{briefTeaser.summary}</p>
      </div>

      <div className="mx-auto shrink-0 lg:mx-6">
        <Image
          src="/illustrations/thunderone-brief.png"
          alt=""
          width={160}
          height={109}
          className="h-auto w-[160px]"
        />
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-zinc-100 pt-3 lg:w-[220px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 dark:border-zinc-800">
        <p className="text-xs text-zinc-400">เตรียมพบกับประสบการณ์ใหม่ ที่จะช่วยให้คุณเห็นภาพรวมองค์กรได้เร็วขึ้น เร็ว ๆ นี้</p>
        <button
          type="button"
          onClick={() => setBriefOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-500 hover:text-indigo-600"
        >
          ดูว่า Brief ทำอะไรได้
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <BriefPanel open={briefOpen} onClose={() => setBriefOpen(false)} />
    </Card>
  );
}
