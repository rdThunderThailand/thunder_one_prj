"use client";

import { useState } from "react";
import { countTabs } from "../mock-data";

export function CountTabs({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<(typeof countTabs)[number]>(countTabs[0]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 border-b border-border">
        {countTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={`border-b-2 px-1 pb-2.5 text-sm font-medium transition-colors ${
              active === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {active === countTabs[0] ? (
        children
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-t1-gray-400">
          ยังไม่มีข้อมูลสำหรับแท็บนี้
        </div>
      )}
    </div>
  );
}
