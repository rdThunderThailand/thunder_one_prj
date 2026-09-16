import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ClipboardIcon, HelpIcon, MonitorIcon, ShieldIcon, UsersIcon } from "@/components/ui/icons";
import { knowledgeCategories, type KnowledgeCategoryIcon } from "../mock-data";

const iconFor: Record<KnowledgeCategoryIcon, ReactNode> = {
  document: <ClipboardIcon className="h-5 w-5" />,
  shield: <ShieldIcon className="h-5 w-5" />,
  users: <UsersIcon className="h-5 w-5" />,
  monitor: <MonitorIcon className="h-5 w-5" />,
  help: <HelpIcon className="h-5 w-5" />,
};

export function KnowledgeCategoriesRow() {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">หมวดหมู่ความรู้</h2>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400"
        >
          ดูทั้งหมด
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {knowledgeCategories.map((category) => (
          <Card key={category.id} className="flex flex-col gap-2 p-4">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${category.iconTone}`}>
              {iconFor[category.icon]}
            </span>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{category.label}</p>
            <p className="text-xs text-zinc-400">{category.description}</p>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{category.count} รายการ</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
