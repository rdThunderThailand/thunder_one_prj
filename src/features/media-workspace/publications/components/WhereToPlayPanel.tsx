"use client";

import { useState } from "react";
import { ChannelsStep, type ChannelsStepProps } from "./ChannelsStep";

type TabId = "screens" | "channels" | "groups";

const TABS: { id: TabId; label: string; enabled: boolean }[] = [
  { id: "screens", label: "Screens", enabled: false },
  { id: "channels", label: "Channels", enabled: true },
  { id: "groups", label: "Groups", enabled: false },
];

/** Frame 3 "1. Where to Play". Only the Channels tab is reachable — Screens
 *  (target_type "device" is typed but never emitted) and Groups (no such entity)
 *  render DISABLED. */
export function WhereToPlayPanel(props: ChannelsStepProps) {
  const [tab, setTab] = useState<TabId>("channels");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={!t.enabled}
            title={t.enabled ? undefined : "ยังไม่เปิดใช้งาน"}
            onClick={() => t.enabled && setTab(t.id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white text-zinc-900 shadow-sm"
                : t.enabled
                ? "text-zinc-500 hover:text-zinc-900"
                : "cursor-not-allowed text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ChannelsStep {...props} />
    </div>
  );
}
