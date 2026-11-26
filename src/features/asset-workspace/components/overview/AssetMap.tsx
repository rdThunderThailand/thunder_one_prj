"use client";

// Assets on Map (`locations` read, Mapbox as in Core's AssetDistributionMap): one marker per location that has
// coordinates and assets, labelled with its asset count; a click opens the asset list for that location.
// The Locations page passes `href` (marker opens Location Detail) and `includeEmpty` (a location is mapped even with 0 assets).
// mapbox-gl loads only when the widget mounts. Locations without coordinates are counted under the map.
import "mapbox-gl/dist/mapbox-gl.css";
import type { Map as MapboxMap } from "mapbox-gl";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { env } from "@/config/env";
import type { LocationCount } from "../../services/asset-overview-api";
import { EmptyState } from "../states/states";

const hasCoords = (l: LocationCount): l is LocationCount & { latitude: number; longitude: number } =>
  l.latitude !== null && l.longitude !== null;

const assetsAt = (id: string) => `/asset-workspace/assets?location_id=${id}`;

export function AssetMap({
  locations,
  href = assetsAt,
  includeEmpty = false,
  className = "h-48",
}: {
  locations: LocationCount[];
  href?: (id: string) => string;
  includeEmpty?: boolean;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const withAssets = locations.filter((l) => includeEmpty || l.count > 0);
  const pinned = withAssets.filter(hasCoords);
  const unpinned = withAssets.length - pinned.length;

  useEffect(() => {
    const points = locations.filter((l) => includeEmpty || l.count > 0).filter(hasCoords);
    if (!container.current || points.length === 0 || !env.mapboxToken) return;
    let map: MapboxMap | undefined;
    let cancelled = false;

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !container.current) return;
      map = new mapboxgl.Map({
        container: container.current,
        accessToken: env.mapboxToken,
        style: "mapbox://styles/mapbox/light-v11",
        attributionControl: false,
      });
      // Mapbox terms require attribution; compact keeps it to an (i) button.
      map.addControl(new mapboxgl.AttributionControl({ compact: true }));
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      const bounds = new mapboxgl.LngLatBounds();
      for (const l of points) {
        const marker = document.createElement("button");
        marker.type = "button";
        marker.textContent = String(l.count);
        marker.title = l.label;
        marker.setAttribute("aria-label", `${l.label}: ${l.count} ${l.count === 1 ? "asset" : "assets"}`);
        marker.className =
          "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-panel";
        marker.addEventListener("click", () => router.push(href(l.id)));
        new mapboxgl.Marker({ element: marker }).setLngLat([l.longitude, l.latitude]).addTo(map);
        bounds.extend([l.longitude, l.latitude]);
      }
      map.fitBounds(bounds, { padding: 40, maxZoom: 12, duration: 0 });
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [locations, router, href, includeEmpty]);

  if (!env.mapboxToken) return <EmptyState title="Map unavailable" body="Set NEXT_PUBLIC_MAPBOX_TOKEN to show the map." />;
  if (pinned.length === 0) return <EmptyState title="No locations on the map" body="Add coordinates to a location to see its assets here." />;

  return (
    <div>
      <div
        ref={container}
        className={`${className} overflow-hidden rounded-lg bg-muted`}
      />
      {unpinned > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {unpinned} {unpinned === 1 ? "location has" : "locations have"} no coordinates
        </p>
      )}
    </div>
  );
}
