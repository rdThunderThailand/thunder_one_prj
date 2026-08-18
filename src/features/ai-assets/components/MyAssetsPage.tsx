import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BoxIcon, MonitorIcon, PhoneIcon } from "@/components/ui/icons";
import { myAssets, type MyAssetKind } from "../mock-my-assets";

const iconFor: Record<MyAssetKind, React.ReactNode> = {
  laptop: <BoxIcon />,
  monitor: <MonitorIcon />,
  phone: <PhoneIcon />,
};

export function MyAssetsPage() {
  return (
    <div className="flex flex-col gap-4">
      {myAssets.map((asset) => (
        <Card key={asset.id} className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {iconFor[asset.kind]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{asset.tag}</p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{asset.model}</p>
          </div>
          <Badge color="green" variant="dot">
            {asset.status}
          </Badge>
          <button className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900">
            View
          </button>
          <button className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900">
            Report a problem
          </button>
        </Card>
      ))}
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Need help?{" "}
        <span className="font-medium text-indigo-600 dark:text-indigo-400">Contact IT Support</span>
      </p>
    </div>
  );
}
