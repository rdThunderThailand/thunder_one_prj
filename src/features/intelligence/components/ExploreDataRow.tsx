import { Card } from "@/components/ui/Card";
import { BoxIcon, ChartIcon, ChevronRightIcon, ClipboardIcon, LayoutIcon, StarIcon } from "@/components/ui/icons";
import { exploreTiles, type ExploreTileData } from "../mock-data";

const iconFor: Record<ExploreTileData["icon"], React.ReactNode> = {
  dashboards: <LayoutIcon />,
  reports: <ChartIcon />,
  explorer: <BoxIcon />,
  savedViews: <StarIcon />,
  kpiLibrary: <ClipboardIcon />,
};

export function ExploreDataRow() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Explore Data &amp; Reports</h2>
      <div className="flex flex-wrap items-center gap-3">
        {exploreTiles.map((tile) => (
          <div
            key={tile.id}
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-border px-3.5 py-2.5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
              {iconFor[tile.icon]}
            </span>
            <span className="text-sm font-medium text-foreground">{tile.label}</span>
          </div>
        ))}
        <button
          type="button"
          title="Not built yet"
          className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-xl border border-dashed border-border text-t1-gray-400"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
