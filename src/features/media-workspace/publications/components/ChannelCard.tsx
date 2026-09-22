import type { ChannelCategoryId, ChannelItem, ChannelStatus } from "../mock-data";

const categoryLabel: Record<ChannelCategoryId, string> = {
  dooh: "DOOH",
  "in-store": "In-Store TV",
  online: "Online",
  social: "Social Media",
  others: "Other",
};

const statusDot: Record<ChannelStatus, string> = {
  online: "bg-success",
  warning: "bg-warning",
  offline: "bg-danger",
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
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${
        selected ? "border-primary/30 bg-primary-soft ring-1 ring-primary" : "border-border hover:border-border"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
          selected ? "border-primary bg-primary text-white" : "border-border bg-card"
        }`}
      >
        {selected && (
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
            <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{channel.name}</p>
        <p className="truncate text-xs text-muted-foreground">{channel.subLabel}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot[channel.status]}`} />
          <span className="sr-only">{statusLabel[channel.status]}</span>
        </span>
        {channel.resolution && <span className="text-muted-foreground">{channel.resolution}</span>}
      </div>
    </button>
  );
}

export { categoryLabel };
