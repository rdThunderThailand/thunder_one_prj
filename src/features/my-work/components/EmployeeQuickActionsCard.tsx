import { Card } from "@/components/ui/Card";
import { ClockIcon, PaperPlaneIcon, PlusIcon, UploadIcon } from "@/components/ui/icons";

const employeeQuickActions = [
  { id: "eqa-1", label: "Create Task", icon: <PlusIcon /> },
  { id: "eqa-2", label: "Upload File", icon: <UploadIcon /> },
  { id: "eqa-3", label: "Send Message", icon: <PaperPlaneIcon /> },
  { id: "eqa-4", label: "Log Time", icon: <ClockIcon /> },
];

// Decorative — no create/upload/message/time-log flow exists yet.
export function EmployeeQuickActionsCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-4 gap-2">
        {employeeQuickActions.map((action) => (
          <div
            key={action.id}
            title="Not built yet"
            className="flex cursor-not-allowed flex-col items-center gap-1.5 rounded-lg border border-border p-2.5 text-center"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-primary">
              {action.icon}
            </span>
            <span className="text-[11px] leading-tight text-muted-foreground">{action.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
