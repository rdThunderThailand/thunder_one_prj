import { Card } from "@/components/ui/Card";
import { UsersIcon } from "@/components/ui/icons";
import type { OrgUnitNode } from "../mock-data";
import { unitTypeColorClasses } from "../unit-colors";

interface OrgUnitListViewProps {
  units: Record<string, OrgUnitNode>;
  onSelect: (id: string) => void;
}

function indent(units: Record<string, OrgUnitNode>, unit: OrgUnitNode): number {
  let depth = 0;
  let current = unit;
  while (current.parentId) {
    const parent = units[current.parentId];
    if (!parent) break;
    depth += 1;
    current = parent;
  }
  return depth;
}

// "รายชื่อหน่วยงาน" — real since 2026-09-15 (was a permanent placeholder
// before, same as "ตำแหน่งงาน" still is — no position entity exists in
// Core to back that one). A flat table of the same real units the chart
// renders, ordered depth-first so parent/child relationships stay visible
// via indentation, since a plain sorted-by-name list would scatter a
// department's own sub-units all over the table.
export function OrgUnitListView({ units, onSelect }: OrgUnitListViewProps) {
  const rows = Object.values(units).sort((a, b) => {
    const depthDiff = indent(units, a) - indent(units, b);
    return depthDiff !== 0 ? depthDiff : a.name.localeCompare(b.name);
  });

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">หน่วยงาน</th>
            <th className="px-4 py-3 font-medium">รหัส</th>
            <th className="px-4 py-3 font-medium">ประเภท</th>
            <th className="px-4 py-3 font-medium">หัวหน้าหน่วยงาน</th>
            <th className="px-4 py-3 font-medium">พนักงาน</th>
            <th className="px-4 py-3 font-medium">หน่วยงานย่อย</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {rows.map((unit) => (
            <tr
              key={unit.id}
              onClick={() => onSelect(unit.id)}
              className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2" style={{ paddingLeft: indent(units, unit) * 20 }}>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${unitTypeColorClasses(unit.unitType)}`}
                  >
                    <UsersIcon className="h-3 w-3" />
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{unit.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{unit.unitCode}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{unit.unitType}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{unit.headName ?? "-"}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{unit.employeeCount} คน</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{unit.teamsCount} หน่วยงาน</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
