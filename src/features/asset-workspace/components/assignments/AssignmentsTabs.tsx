"use client";

import { useRef, type KeyboardEvent } from "react";
import type { ListUrlState } from "../list-page/useListUrlState";

const tabs = [
  { key: "current", label: "Current Assignments" },
  { key: "history", label: "Assignment History" },
];

export function AssignmentsTabs({ url }: { url: ListUrlState }) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const active = url.get("tab") === "history" ? "history" : "current";

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
      : event.key === "ArrowRight" ? (index + 1) % tabs.length
        : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : null;
    if (next === null) return;
    event.preventDefault();
    buttons.current[next]?.focus();
    url.set({ tab: tabs[next].key });
  }

  return (
    <div role="tablist" aria-label="Assignments views" className="flex gap-1 border-b border-border">
      {tabs.map((tab, index) => (
        <button
          key={tab.key}
          ref={(button) => { buttons.current[index] = button; }}
          id={`assignments-tab-${tab.key}`}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          aria-controls="assignments-panel"
          tabIndex={active === tab.key ? 0 : -1}
          onKeyDown={(event) => onKeyDown(event, index)}
          onClick={() => url.set({ tab: tab.key })}
          className={`min-h-10 border-b-2 px-3 py-2 text-xs font-semibold transition-colors motion-reduce:transition-none ${
            active === tab.key ? "border-primary text-accent-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
