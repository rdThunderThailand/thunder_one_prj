import { Card } from "@/components/ui/Card";
import { policyUpdates, type PolicyUpdateData } from "../mock-data";

const badgeTone: Record<PolicyUpdateData["badge"], string> = {
  New: "bg-success-muted text-t1-green-700",
  Updated: "bg-info-muted text-t1-blue-700",
};

export function PolicyUpdatesCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Policy Updates</h2>
        <button className="text-xs font-medium text-primary hover:text-accent-foreground">
          View all
        </button>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {policyUpdates.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-t1-gray-50">
              <span className="text-xs font-semibold text-foreground">{item.day}</span>
              <span className="text-[9px] uppercase text-t1-gray-400">{item.month}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
              <p className="truncate text-xs text-t1-gray-400">{item.subtitle}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeTone[item.badge]}`}>
              {item.badge}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
