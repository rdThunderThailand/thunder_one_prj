"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { MoreIcon } from "@/components/ui/icons";
import { scopeOptions } from "../mock-data";

export function ScopeCard() {
  const [active, setActive] = useState(scopeOptions[0].id);

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Scope</h2>
      <div className="flex flex-wrap items-center gap-2">
        {scopeOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActive(option.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              active === option.id
                ? "border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          title="Not built yet"
          className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 dark:border-zinc-700"
        >
          <MoreIcon className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
