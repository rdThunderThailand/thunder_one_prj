"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  BoxIcon,
  ChartIcon,
  ClipboardIcon,
  LightningIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { knowledgeCategories, type KnowledgeCategoryData } from "../mock-data";

const iconFor: Record<KnowledgeCategoryData["icon"], React.ReactNode> = {
  book: <ClipboardIcon className="h-4 w-4" />,
  rocket: <LightningIcon className="h-4 w-4" />,
  document: <ClipboardIcon className="h-4 w-4" />,
  box: <BoxIcon className="h-4 w-4" />,
  search: <SearchIcon className="h-4 w-4" />,
  wrench: <SettingsIcon className="h-4 w-4" />,
  shield: <ShieldIcon className="h-4 w-4" />,
  chart: <ChartIcon className="h-4 w-4" />,
  clipboard: <ClipboardIcon className="h-4 w-4" />,
  settings: <SettingsIcon className="h-4 w-4" />,
};

export function KnowledgeCategoriesCard() {
  const [active, setActive] = useState(knowledgeCategories[0].id);

  return (
    <Card className="p-3">
      <h2 className="mb-2 px-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">หมวดหมู่</h2>
      <ul className="flex flex-col gap-0.5">
        {knowledgeCategories.map((category) => (
          <li key={category.id}>
            <button
              type="button"
              onClick={() => setActive(category.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                active === category.id
                  ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <span className={category.iconTone}>{iconFor[category.icon]}</span>
              <span className="flex-1 truncate text-left">{category.label}</span>
              <span className="shrink-0 text-xs text-zinc-400">{category.count}</span>
            </button>
          </li>
        ))}
      </ul>
      <button className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10">
        ดูทุกหมวดหมู่ →
      </button>
    </Card>
  );
}
