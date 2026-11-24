"use client";

import { useState } from "react";
import { SettingsIcon, SparklesIcon } from "@/components/ui/icons";

const TABS = ["For You", "Explore"] as const;

export function EmployeeIntelligenceHeader() {
  const [active, setActive] = useState<(typeof TABS)[number]>("For You");

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          Intelligence
          <SparklesIcon className="h-5 w-5 text-primary" />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Insights that help you make better decisions and work better.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActive(tab)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                active === tab
                  ? "bg-accent text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {tab === "For You" && <SparklesIcon className="h-3.5 w-3.5" />}
              {tab}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-t1-gray-50"
        >
          Customize
          <SettingsIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
