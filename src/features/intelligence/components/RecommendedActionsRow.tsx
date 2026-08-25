import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, LayoutIcon, RepeatIcon } from "@/components/ui/icons";
import { employeeRecommendedActions, type RecommendedActionData } from "../mock-data";

const iconFor: Record<RecommendedActionData["icon"], React.ReactNode> = {
  approve: <CheckCircleIcon />,
  update: <RepeatIcon />,
  template: <LayoutIcon />,
};

export function RecommendedActionsRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {employeeRecommendedActions.map((action) => (
        <Card key={action.id} className="flex flex-col gap-2 p-4">
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.iconTone}`}>
            {iconFor[action.icon]}
          </span>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{action.title}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{action.detail}</p>
          <span
            title="Not built yet"
            className="mt-1 inline-flex w-fit cursor-not-allowed items-center rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            {action.actionLabel}
          </span>
        </Card>
      ))}
    </div>
  );
}
