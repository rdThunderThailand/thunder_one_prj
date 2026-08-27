"use client";

import { useState } from "react";
import { returnTabs } from "../mock-data";

export function ReturnTabs({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<(typeof returnTabs)[number]>(returnTabs[0]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 border-b border-zinc-200 dark:border-zinc-800">
        {returnTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={`border-b-2 px-1 pb-2.5 text-sm font-medium transition-colors ${
              active === tab
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {active === returnTabs[0] ? (
        children
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
          ยังไม่มีข้อมูลสำหรับแท็บนี้
        </div>
      )}
    </div>
  );
}
