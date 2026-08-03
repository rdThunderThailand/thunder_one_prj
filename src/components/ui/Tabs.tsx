"use client";

import { useState, type ReactNode } from "react";

interface TabItem {
  key: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultKey?: string;
}

export function Tabs({ items, defaultKey }: TabsProps) {
  const [active, setActive] = useState(defaultKey ?? items[0]?.key);
  const activeItem = items.find((item) => item.key === active);

  return (
    <div>
      <div
        role="tablist"
        className="flex gap-1 border-b border-zinc-100 dark:border-zinc-800"
      >
        {items.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={active === item.key}
            onClick={() => setActive(item.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active === item.key
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{activeItem?.content}</div>
    </div>
  );
}
