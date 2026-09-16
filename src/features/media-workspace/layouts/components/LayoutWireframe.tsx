// The list thumbnail, the template rail tile and (later) the wizard's read-only canvas are
// the same picture at three sizes: rectangles derived from the Zone percentages at display
// time. Nothing is generated, stored or invalidated, so a thumbnail can never drift from the
// geometry it depicts (docs/layouts/plan-layout-ui.md §2.5).
//
// ponytail: preserveAspectRatio="none" plus a CSS aspect-ratio does the letterboxing, which
// removes the ratio arithmetic entirely — the Zone percentages are the SVG coordinates.
// Upgrade to a computed viewBox only if a Zone ever needs a stroke of constant visual width.

import { parseAspectRatio } from "../geometry";
import type { LayoutZone } from "../types";

// Zone fill cycles by position — role is gone (ADR 0049 §2), so colour is purely for telling
// adjacent Zones apart, not for meaning.
const ZONE_FILL = ["fill-violet-500/70", "fill-sky-500/70", "fill-amber-500/70", "fill-zinc-400/70"];

interface LayoutWireframeProps {
  zones: LayoutZone[];
  background: string;
  aspectRatio: string;
  className?: string;
  selectedZoneId?: string | null;
  onZoneSelect?: (zoneId: string) => void;
  shouldShowLabels?: boolean;
}

export function LayoutWireframe({
  zones,
  background,
  aspectRatio,
  className,
  selectedZoneId,
  onZoneSelect,
  shouldShowLabels = false,
}: LayoutWireframeProps) {
  const [ratioW, ratioH] = parseAspectRatio(aspectRatio) ?? [16, 9];

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Layout wireframe, ${zones.length} zone${zones.length === 1 ? "" : "s"}`}
      style={{ aspectRatio: `${ratioW} / ${ratioH}`, backgroundColor: background }}
      className={className}
    >
      {zones.map((zone, index) => {
        const zoneId = zone.id ?? `${zone.position}-${index}`;
        const isSelected = zoneId === selectedZoneId;
        return (
          <g
            key={zoneId}
            role={onZoneSelect ? "button" : undefined}
            tabIndex={onZoneSelect ? 0 : undefined}
            aria-label={onZoneSelect ? `Select ${zone.name} Zone` : undefined}
            onClick={() => onZoneSelect?.(zoneId)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onZoneSelect?.(zoneId);
            }}
            className={onZoneSelect ? "cursor-pointer outline-none" : undefined}
          >
            <rect
              x={zone.x}
              y={zone.y}
              width={zone.width}
              height={zone.height}
              className={`${ZONE_FILL[index % ZONE_FILL.length]} ${isSelected ? "stroke-indigo-950 stroke-[1.5]" : "stroke-white/70 stroke-[0.5]"}`}
            />
            {shouldShowLabels && (
              <text
                x={zone.x + zone.width / 2}
                y={zone.y + zone.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none fill-white text-[4px] font-semibold"
              >
                {zone.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
