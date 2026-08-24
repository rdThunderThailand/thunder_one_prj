import { Card } from "@/components/ui/Card";
import { UsersIcon } from "@/components/ui/icons";
import { getDepartmentAssets, mockTeamMembers } from "../mock-data";

export function TeamPage() {
  const departmentAssets = getDepartmentAssets();

  return (
    <div className="flex flex-col gap-3">
      {mockTeamMembers.map((member) => {
        const assetCount = departmentAssets.filter((a) => a.assigneeId === member.id).length;
        return (
          <Card key={member.id} className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <UsersIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{member.name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{member.role}</p>
            </div>
            <span className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
              {assetCount} asset{assetCount === 1 ? "" : "s"}
            </span>
          </Card>
        );
      })}
    </div>
  );
}
