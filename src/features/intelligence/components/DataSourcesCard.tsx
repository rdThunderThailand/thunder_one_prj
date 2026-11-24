import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, CurrencyIcon, LightningIcon, MegaphoneIcon, ShieldIcon, UsersIcon } from "@/components/ui/icons";
import { dataSources, type DataSourceData } from "../mock-data";

const iconFor: Record<DataSourceData["icon"], React.ReactNode> = {
  platform: <LightningIcon />,
  megaphone: <MegaphoneIcon />,
  currency: <CurrencyIcon />,
  users: <UsersIcon />,
  shield: <ShieldIcon />,
};

export function DataSourcesCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Data Sources</h2>
        <span className="rounded-full bg-success-muted px-2 py-0.5 text-[11px] font-medium text-t1-green-700">
          All connected
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {dataSources.map((source) => (
          <li key={source.id} className="flex items-center gap-2.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${source.iconTone}`}
            >
              {iconFor[source.icon]}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{source.name}</span>
            <span className="shrink-0 text-xs text-t1-gray-400">{source.syncedLabel}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent-foreground"
      >
        View all data sources
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
