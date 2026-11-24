import { Card } from "@/components/ui/Card";
import { GlobeIcon } from "@/components/ui/icons";
import { getMockAssets } from "../services/mock-assets";
import { mockLocations } from "../mock-reference-data";

// A flat list, not the hierarchical tree the requirement doc (AM-05)
// describes — building a real location tree editor is a separate, larger
// piece of future work; this is enough to see what's where.
export function LocationsPage() {
  const assets = getMockAssets();

  return (
    <div className="flex flex-col gap-3">
      {mockLocations.map((location) => {
        const count = assets.filter((a) => a.locationId === location.id).length;
        return (
          <Card key={location.id} className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <GlobeIcon />
            </span>
            <p className="flex-1 text-sm font-medium text-foreground">
              {location.name}
            </p>
            <span className="shrink-0 text-sm text-muted-foreground">
              {count} asset{count === 1 ? "" : "s"}
            </span>
          </Card>
        );
      })}
    </div>
  );
}
