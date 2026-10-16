import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { dashboardNotifications, type DashboardNotificationRow } from "../mock-data";

const dotColor: Record<DashboardNotificationRow["severity"], string> = {
  red: "bg-error",
  amber: "bg-warning",
};

export function DashboardNotificationsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">การแจ้งเตือน</h2>
      <ul className="flex flex-1 flex-col gap-3">
        {dashboardNotifications.map((item) => (
          <li key={item.id} className="flex items-start gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor[item.severity]}`} aria-hidden="true" />
            <p className="flex-1 text-sm text-foreground">{item.text}</p>
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {item.count}
            </span>
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-xs font-medium text-primary hover:text-primary">
        ดูการแจ้งเตือนทั้งหมด
        <ArrowRightIcon className="h-3 w-3" />
      </button>
    </Card>
  );
}
