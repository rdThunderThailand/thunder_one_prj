import { Card } from "@/components/ui/Card";
import { HeadsetIcon } from "@/components/ui/icons";

export function KnowledgeNeedHelpCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ต้องการความช่วยเหลือ?</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">ยังหาคำตอบไม่เจอ? ติดต่อทีม HR ได้เลย</p>
      <span
        title="Not built yet"
        className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg bg-indigo-300 py-2 text-sm font-medium text-white dark:bg-indigo-500/40"
      >
        <HeadsetIcon className="h-4 w-4" />
        ติดต่อ HR
      </span>
    </Card>
  );
}
