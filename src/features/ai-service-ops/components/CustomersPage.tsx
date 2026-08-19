import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { mockCustomers, type CustomerRow } from "../mock-data";

const statusBadge: Record<CustomerRow["status"], { color: "green" | "yellow" | "red"; label: string }> = {
  green: { color: "green", label: "Healthy" },
  yellow: { color: "yellow", label: "Attention" },
  red: { color: "red", label: "Critical" },
};

export function CustomersPage() {
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Health Score</th>
            <th className="px-4 py-3 font-medium">Open Requests</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {mockCustomers.map((customer) => (
            <tr key={customer.id}>
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                {customer.name}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                {customer.healthScore}%
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                {customer.openRequests}
              </td>
              <td className="px-4 py-3">
                <Badge color={statusBadge[customer.status].color} variant="pill">
                  {statusBadge[customer.status].label}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
