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
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">Asset</th>
            <th className="px-4 py-3 font-medium">Vendor</th>
            <th className="px-4 py-3 font-medium">Expires</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {agreements.map((ma) => (
            <tr key={ma.id}>
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{ma.assetTag}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{ma.vendorName}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{ma.expiryDate}</td>
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
