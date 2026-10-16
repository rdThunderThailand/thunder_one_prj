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
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <UsersIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{member.name}</p>
              <p className="text-xs text-muted-foreground">{member.role}</p>
            </div>
            <span className="shrink-0 text-sm text-muted-foreground">
              {assetCount} asset{assetCount === 1 ? "" : "s"}
            </span>
          </Card>
        );
      })}
    </div>
  );
}
