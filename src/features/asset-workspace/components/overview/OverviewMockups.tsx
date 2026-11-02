// Layout-only stand-in for Assets on Map, with fixed sample data (FigJam 445:833). It waits for the
// Lead's map-library decision; replace it with a real widget, or delete it, once decided.
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
      <Badge
        variant="pill"
        className="absolute right-2 top-2 z-10"
      >
        Mockup
      </Badge>
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
