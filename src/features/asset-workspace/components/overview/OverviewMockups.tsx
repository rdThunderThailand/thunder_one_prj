// Layout-only stand-ins for two Overview widgets, with fixed sample data (FigJam 445:833).
// Assets on Map waits for the Lead's map-library decision; Alerts & Notifications was dropped
// in scope review (Notifications belong to the Platform Shell) and is kept here only for layout.
// Replace each with a real widget, or delete it, once decided.
import { Badge } from "@/components/ui/Badge";
import { LocationIcon } from "@/components/ui/icons";

const MOCK_MARKERS = [
  { label: "Head Office", count: 48, top: "45%", left: "30%" },
  { label: "Branch 01", count: 32, top: "70%", left: "55%" },
  { label: "Warehouse", count: 18, top: "20%", left: "50%" },
  { label: "Branch 04", count: 14, top: "25%", left: "78%" },
];

export function MapMockup() {
  return (
    <div className="relative h-48 overflow-hidden rounded-lg bg-muted">
      <MockTag />
      {MOCK_MARKERS.map((m) => (
        <span
          key={m.label}
          title={m.label}
          className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-panel"
          style={{ top: m.top, left: m.left }}
        >
          {m.count}
        </span>
      ))}
      <LocationIcon className="absolute bottom-2 right-2 h-4 w-4 text-muted-foreground" />
    </div>
  );
}

const MOCK_ALERTS = [
  { title: "MFP Ricoh IM C300 warranty expiring", detail: "AST-000729 · Head Office", tab: "Warranty", due: "2 days" },
  { title: "Outdoor LED P2.5 in maintenance", detail: "AST-000913 · Branch 03", tab: "Maintenance", due: "5 days" },
  { title: "Core Switch warranty expiring", detail: "AST-000654 · Head Office", tab: "Warranty", due: "7 days" },
] as const;

const TABS = ["All", "Warranty", "Maintenance"] as const;

export function AlertsMockup() {
  return (
    <div className="relative">
      <MockTag />
      <div className="mb-2 flex gap-3 border-b border-border text-xs">
        {TABS.map((tab, i) => (
          <span
            key={tab}
            className={i === 0 ? "border-b-2 border-primary pb-1.5 font-medium text-primary" : "pb-1.5 text-muted-foreground"}
          >
            {tab} ({tab === "All" ? MOCK_ALERTS.length : MOCK_ALERTS.filter((a) => a.tab === tab).length})
          </span>
        ))}
      </div>
      <ul className="divide-y divide-border">
        {MOCK_ALERTS.map((alert) => (
          <li
            key={alert.title}
            className="flex items-start justify-between gap-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{alert.title}</p>
              <p className="truncate text-xs text-muted-foreground">{alert.detail}</p>
            </div>
            <span className="shrink-0 text-xs font-medium text-t1-red-700">{alert.due}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MockTag() {
  return (
    <Badge
      variant="pill"
      className="absolute right-2 top-2 z-10"
    >
      Mockup
    </Badge>
  );
}
