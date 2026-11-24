"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { MoreIcon } from "@/components/ui/icons";
import { scopeOptions } from "../mock-data";

export function ScopeCard() {
  const [active, setActive] = useState(scopeOptions[0].id);

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Scope</h2>
      <div className="flex flex-wrap items-center gap-2">
        {scopeOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActive(option.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              active === option.id
                ? "border-t1-blue-200 bg-accent text-primary"
                : "border-border text-muted-foreground hover:bg-t1-gray-50"
            }`}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          title="Not built yet"
          className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-border text-t1-gray-400"
        >
          <MoreIcon className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
