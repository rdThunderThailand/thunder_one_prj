import { Card } from "@/components/ui/Card";
import { organizationInfo } from "../mock-data";

const rows: { label: string; value: string }[] = [
  { label: "Company", value: organizationInfo.company },
  { label: "Headquarters", value: organizationInfo.headquarters },
  { label: "Employees", value: organizationInfo.employees },
  { label: "Fiscal Year", value: organizationInfo.fiscalYear },
];

export function OrganizationInfoCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Organization Info</h2>
      <dl className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2 text-sm">
            <dt className="text-t1-gray-400">{row.label}</dt>
            <dd className="text-right font-medium text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
