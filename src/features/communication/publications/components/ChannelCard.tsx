import { EnvelopeIcon, GlobeIcon, MonitorIcon, ShareNodesIcon } from "@/components/ui/icons";
import type { ChannelCategoryId, ChannelItem, ChannelStatus } from "../mock-data";
import type { ReactNode } from "react";

const categoryIcon: Record<ChannelCategoryId, ReactNode> = {
  dooh: <MonitorIcon />,
  "in-store": <MonitorIcon />,
  online: <GlobeIcon />,
  social: <ShareNodesIcon />,
  others: <EnvelopeIcon />,
};

const categoryBadgeColor: Record<ChannelCategoryId, string> = {
  dooh: "bg-indigo-50 text-indigo-600",
  "in-store": "bg-blue-50 text-blue-600",
  online: "bg-emerald-50 text-emerald-600",
  social: "bg-violet-50 text-violet-600",
  others: "bg-amber-50 text-amber-600",
};

const categoryLabel: Record<ChannelCategoryId, string> = {
  dooh: "DOOH",
  "in-store": "In-Store TV",
  online: "Online",
  social: "Social Media",
  others: "Other",
};

const statusDot: Record<ChannelStatus, string> = {
  online: "bg-emerald-500",
  warning: "bg-amber-500",
  offline: "bg-red-500",
};

const statusLabel: Record<ChannelStatus, string> = {
  online: "Online",
  warning: "Warning",
  offline: "Offline",
};

export function ChannelCard({
  channel,
  selected,
  onToggle,
}: {
  channel: ChannelItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex flex-col gap-2.5 rounded-lg border p-3 text-left transition-colors ${
        selected ? "border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-400" : "border-zinc-200 hover:border-zinc-300"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
            selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 bg-white"
          }`}
        >
          {selected && (
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
              <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${categoryBadgeColor[channel.category]}`}>
          <span className="h-4 w-4">{categoryIcon[channel.category]}</span>
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-900">{channel.name}</p>
        <p className="text-xs text-zinc-400">{categoryLabel[channel.category]}</p>
        <p className="truncate text-xs text-zinc-400">{channel.subLabel}</p>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-zinc-600">
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot[channel.status]}`} />
          {statusLabel[channel.status]}
        </span>
        {channel.resolution && <span className="text-zinc-400">{channel.resolution}</span>}
      </div>
    </button>
  );
}

export { categoryIcon, categoryBadgeColor, categoryLabel };
