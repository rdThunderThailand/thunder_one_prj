"use client";

import { useState } from "react";
import { ChannelsStep, type ChannelsStepProps } from "./ChannelsStep";
import { GroupsStep } from "./GroupsStep";

type TabId = "screens" | "channels" | "groups";

const TABS: { id: TabId; label: string; enabled: boolean }[] = [
  { id: "screens", label: "Screens", enabled: false },
  { id: "channels", label: "Channels", enabled: true },
  { id: "groups", label: "Channel Groups", enabled: true },
];

/** Frame 3 "1. Where to Play" (D11 modal A: "Channels / Channel Groups / All Channels").
 *  Screens (direct device targeting) stays disabled — out of this epic's scope. Channels and
 *  Channel Groups are both reachable; ChannelsStep still shows saved Group intent as removable
 *  chips above its own list, since a Channel picked directly and one reached through a Group
 *  are independent intents (ADR 0074 §6). */
export function WhereToPlayPanel(props: ChannelsStepProps) {
  const [tab, setTab] = useState<TabId>("channels");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="grid grid-cols-[0.8fr_1fr_1.35fr] gap-1 rounded-lg bg-muted p-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={!t.enabled}
            title={t.enabled ? undefined : "ยังไม่เปิดใช้งาน"}
            onClick={() => t.enabled && setTab(t.id)}
            className={`min-w-0 rounded-md px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? "bg-card text-foreground shadow-sm"
                : t.enabled
                ? "text-muted-foreground hover:text-foreground"
                : "cursor-not-allowed text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "groups" ? <GroupsStep /> : <ChannelsStep {...props} />}
    </div>
  );
}
