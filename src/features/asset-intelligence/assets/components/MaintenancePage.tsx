import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getMockMaintenanceAgreements, type MaintenanceAgreementStatus } from "../mock-maintenance";

const statusBadge: Record<MaintenanceAgreementStatus, { color: "green" | "yellow" | "red"; label: string }> = {
  active: { color: "green", label: "Active" },
  expiring_soon: { color: "yellow", label: "Expiring Soon" },
  expired: { color: "red", label: "Expired" },
};

export function MaintenancePage() {
  const agreements = getMockMaintenanceAgreements();

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Asset</th>
            <th className="px-4 py-3 font-medium">Vendor</th>
            <th className="px-4 py-3 font-medium">Expires</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {agreements.map((ma) => (
            <tr key={ma.id}>
              <td className="px-4 py-3 font-medium text-foreground">{ma.assetTag}</td>
              <td className="px-4 py-3 text-muted-foreground">{ma.vendorName}</td>
              <td className="px-4 py-3 text-muted-foreground">{ma.expiryDate}</td>
              <td className="px-4 py-3">
                <Badge color={statusBadge[ma.status].color} variant="pill">
                  {statusBadge[ma.status].label}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
