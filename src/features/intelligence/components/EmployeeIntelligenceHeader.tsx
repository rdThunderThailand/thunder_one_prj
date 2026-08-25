"use client";

import { useState } from "react";
import { SettingsIcon, SparklesIcon } from "@/components/ui/icons";

const TABS = ["For You", "Explore"] as const;

export function EmployeeIntelligenceHeader() {
  const [active, setActive] = useState<(typeof TABS)[number]>("For You");

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Intelligence
          <SparklesIcon className="h-5 w-5 text-indigo-500" />
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Insights that help you make better decisions and work better.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActive(tab)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                active === tab
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {tab === "For You" && <SparklesIcon className="h-3.5 w-3.5" />}
              {tab}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Customize
          <SettingsIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
