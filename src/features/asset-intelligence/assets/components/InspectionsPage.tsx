import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getMockInspections, type InspectionStatus } from "../mock-inspections";

const statusBadge: Record<InspectionStatus, { color: "green" | "blue" | "red"; label: string }> = {
  scheduled: { color: "blue", label: "Scheduled" },
  completed: { color: "green", label: "Completed" },
  overdue: { color: "red", label: "Overdue" },
};

export function InspectionsPage() {
  const inspections = getMockInspections();

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Asset</th>
            <th className="px-4 py-3 font-medium">Inspector</th>
            <th className="px-4 py-3 font-medium">Scheduled</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {inspections.map((inspection) => (
            <tr key={inspection.id}>
              <td className="px-4 py-3 font-medium text-foreground">
                {inspection.assetTag}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {inspection.inspectorName}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {inspection.scheduledDate}
              </td>
              <td className="px-4 py-3">
                <Badge color={statusBadge[inspection.status].color} variant="pill">
                  {statusBadge[inspection.status].label}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
