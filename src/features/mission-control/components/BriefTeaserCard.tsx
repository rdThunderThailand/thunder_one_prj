import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, SparklesIcon } from "@/components/ui/icons";
import { briefTeaser } from "../mock-data";

// A static teaser for an AI-style summary panel — no assistant/insights
// backend exists anywhere in this app, same honest-preview treatment the
// retired AskThunderOneCard used. The "ดูว่า Brief ทำอะไรได้ได้" button is
// inert on purpose (title attr explains why) rather than linking somewhere
// that doesn't exist yet.
export function BriefTeaserCard() {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
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
        <button
          type="button"
          disabled
          title="ฟีเจอร์นี้ยังไม่พร้อมใช้งาน"
          className="mt-3 flex cursor-not-allowed items-center gap-1.5 text-sm font-medium text-indigo-400"
        >
          ดูว่า Brief ทำอะไรได้ได้
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="max-w-[220px] shrink-0 text-right text-xs text-zinc-400">
        เตรียมพบกับประสบการณ์ใหม่ที่จะช่วยให้คุณเห็นภาพรวมองค์กรได้เร็วขึ้น เร็ว ๆ นี้
      </p>
    </Card>
  );
}
