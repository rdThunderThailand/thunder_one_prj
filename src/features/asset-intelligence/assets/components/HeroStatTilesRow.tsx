import { Card } from "@/components/ui/Card";
import { BoxIcon, CheckCircleIcon, GaugeIcon, RepeatIcon, SettingsIcon, XIcon } from "@/components/ui/icons";
import { heroStatTiles, type HeroStatTileData } from "../mock-data";

const iconFor: Record<HeroStatTileData["icon"], React.ReactNode> = {
  readiness: <GaugeIcon />,
  box: <BoxIcon />,
  checkCircle: <CheckCircleIcon />,
  wrench: <SettingsIcon />,
  truck: <RepeatIcon />,
  xCircle: <XIcon />,
};

function DonutRing({ percent }: { percent: number }) {
  const circumference = 2 * Math.PI * 16;
  const offset = circumference * (1 - percent / 100);
  return (
    <svg viewBox="0 0 40 40" className="h-11 w-11 shrink-0 -rotate-90">
      <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="4" className="text-indigo-100 dark:text-indigo-500/20" />
      <circle
        cx="20"
        cy="20"
        r="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-indigo-500"
      />
    </svg>
  );
}

export function HeroStatTilesRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {heroStatTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between">
            {tile.viz?.type === "donut" ? (
              <DonutRing percent={tile.viz.percent} />
            ) : (
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tile.iconTone}`}>
                {iconFor[tile.icon]}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tile.label}</p>
          <p>
            <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</span>
            {tile.unit && <span className="ml-0.5 text-sm text-zinc-400">{tile.unit}</span>}
          </p>
          {tile.deltaLabel ? (
            <p className="text-xs font-medium text-emerald-500">{tile.deltaLabel}</p>
          ) : (
            <p className="text-xs text-zinc-400">{tile.sublabel}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
