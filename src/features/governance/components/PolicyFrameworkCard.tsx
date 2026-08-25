import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, BuildingIcon, ClipboardIcon, LockIcon, UsersIcon } from "@/components/ui/icons";
import { policyFrameworkCategories, type PolicyFrameworkCategoryData } from "../mock-data";

const iconFor: Record<PolicyFrameworkCategoryData["icon"], React.ReactNode> = {
  building: <BuildingIcon />,
  lock: <LockIcon />,
  users: <UsersIcon />,
  document: <ClipboardIcon />,
};

export function PolicyFrameworkCard() {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Policy Framework</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View All Policies
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {policyFrameworkCategories.map((category) => (
          <div key={category.id} className="rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${category.iconTone}`}>
              {iconFor[category.icon]}
            </span>
            <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{category.name}</p>
            <p className="text-xs text-zinc-400">{category.policyCount} policies</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
