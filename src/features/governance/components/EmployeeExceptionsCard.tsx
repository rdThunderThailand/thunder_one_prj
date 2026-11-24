import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ClockIcon, CurrencyIcon, ShieldIcon } from "@/components/ui/icons";
import { employeeExceptions, type EmployeeExceptionData } from "../mock-data";

const iconFor: Record<EmployeeExceptionData["icon"], React.ReactNode> = {
  budget: <CurrencyIcon className="h-3.5 w-3.5" />,
  policy: <ShieldIcon className="h-3.5 w-3.5" />,
  late: <ClockIcon className="h-3.5 w-3.5" />,
};

const severityColor: Record<EmployeeExceptionData["severity"], "red" | "yellow"> = {
  High: "red",
  Medium: "yellow",
};

const detailTone: Record<EmployeeExceptionData["detailTone"], string> = {
  red: "text-t1-red-700",
  zinc: "text-muted-foreground",
};

export function EmployeeExceptionsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Exceptions</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-border">
        {employeeExceptions.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 py-3 first:pt-0 last:pb-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-error-muted text-error">
              {iconFor[item.icon]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">{item.department}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className={`text-xs font-medium ${detailTone[item.detailTone]}`}>{item.detail}</span>
              <Badge variant="pill" color={severityColor[item.severity]}>
                {item.severity}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
