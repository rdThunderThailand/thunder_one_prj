import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, CheckCircleIcon, EnvelopeIcon, UploadIcon } from "@/components/ui/icons";
import { employeeActivity, type EmployeeActivityItem } from "../mock-data";

const iconFor: Record<EmployeeActivityItem["icon"], React.ReactNode> = {
  approve: <CheckCircleIcon className="h-3.5 w-3.5" />,
  upload: <UploadIcon className="h-3.5 w-3.5" />,
  comment: <EnvelopeIcon className="h-3.5 w-3.5" />,
};

const tone: Record<EmployeeActivityItem["icon"], string> = {
  approve: "bg-success-muted text-success",
  upload: "bg-info-muted text-info",
  comment: "bg-in-progress-muted text-in-progress",
};

export function EmployeeActivityCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-1 flex-col gap-3">
        {employeeActivity.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5">
            <Avatar name={item.name} size={26} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">
                <span className="font-medium text-foreground">{item.name}</span> {item.action}{" "}
                <span className="font-medium text-foreground">{item.target}</span>
              </p>
              <p className="text-xs text-t1-gray-400">{item.timeAgo}</p>
            </div>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone[item.icon]}`}>
              {iconFor[item.icon]}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
