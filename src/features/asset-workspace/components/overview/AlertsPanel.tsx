"use client";

// Alerts & Notifications (option b, 2026-11-02): the same #78 warranty and #1 In Maintenance rows as
// Assets Needing Attention, shown as alerts with days left / days in maintenance. No data of its own;
// platform notifications stay in the Shell bell (02 §4.2).
import Link from "next/link";
import { useState } from "react";

export interface AlertItem {
  key: string;
  kind: "Warranty" | "Maintenance";
  title: string;
  detail: string;
  href: string;
  /** "3 days left", "for 12 days" … */
  due: string;
}

const TABS = ["All", "Warranty", "Maintenance"] as const;

export function AlertsPanel({ items }: { items: AlertItem[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const shown = tab === "All" ? items : items.filter((a) => a.kind === tab);

  return (
    <div>
      <div
        role="tablist"
        className="mb-2 flex gap-3 border-b border-border text-xs"
      >
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={tab === t ? "border-b-2 border-primary pb-1.5 font-medium text-primary" : "pb-1.5 text-muted-foreground hover:text-foreground"}
          >
            {t} ({t === "All" ? items.length : items.filter((a) => a.kind === t).length})
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No alerts</p>
      ) : (
        <ul className="divide-y divide-border">
          {shown.map((alert) => (
            <li
              key={alert.key}
              className="flex items-start justify-between gap-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <Link
                  href={alert.href}
                  className="block truncate font-medium text-foreground hover:underline"
                >
                  {alert.title}
                </Link>
                <p className="truncate text-xs text-muted-foreground">{alert.detail}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-t1-amber-700">{alert.due}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
