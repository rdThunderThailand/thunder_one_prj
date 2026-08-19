import { Card } from "@/components/ui/Card";
import { getMockAssets, mockDepartments } from "@/features/ai-assets";

// CEO-05b: a cross-department rollup -- distinct from ai-assets's own
// category-based Reports page (that's Asset Manager's operational lens; this
// is the CEO's organizational one). No export, same as every other role's
// un-exportable Reports page this sprint.
export function ReportsPage() {
  const assets = getMockAssets();

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Total Assets</th>
            <th className="px-4 py-3 font-medium">Critical</th>
            <th className="px-4 py-3 font-medium">Replacement Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {mockDepartments.map((dept) => {
            const deptAssets = assets.filter((a) => a.departmentId === dept.id);
            const critical = deptAssets.filter((a) => a.status === "critical").length;
            const value = deptAssets.reduce((sum, a) => sum + a.purchaseValue, 0);
            return (
              <tr key={dept.id}>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  {dept.name}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{deptAssets.length}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {critical > 0 ? <span className="text-red-500">{critical}</span> : 0}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  ฿{value.toLocaleString("en-US")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
