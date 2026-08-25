// The list thumbnail, the template rail tile and (later) the wizard's read-only canvas are
// the same picture at three sizes: rectangles derived from the Zone percentages at display
// time. Nothing is generated, stored or invalidated, so a thumbnail can never drift from the
// geometry it depicts (docs/layouts/plan-layout-ui.md §2.5).
//
// ponytail: preserveAspectRatio="none" plus a CSS aspect-ratio does the letterboxing, which
// removes the ratio arithmetic entirely — the Zone percentages are the SVG coordinates.
// Upgrade to a computed viewBox only if a Zone ever needs a stroke of constant visual width.

import { parseAspectRatio } from "../geometry";
import type { LayoutZone, ZoneRole } from "../types";

const ROLE_FILL: Record<ZoneRole, string> = {
  main: "fill-violet-500/70",
  sidebar: "fill-sky-500/70",
  ticker: "fill-amber-500/70",
  secondary: "fill-zinc-400/70",
};

interface LayoutWireframeProps {
  zones: LayoutZone[];
  background: string;
  aspectRatio: string;
  className?: string;
}

export function LayoutWireframe({
  zones,
  background,
  aspectRatio,
  className,
}: LayoutWireframeProps) {
  const [ratioW, ratioH] = parseAspectRatio(aspectRatio);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Layout wireframe, ${zones.length} zone${zones.length === 1 ? "" : "s"}`}
      style={{ aspectRatio: `${ratioW} / ${ratioH}`, backgroundColor: background }}
      className={className}
    >
      {zones.map((zone, index) => (
        <rect
          key={zone.id ?? `${zone.position}-${index}`}
          x={zone.x}
          y={zone.y}
          width={zone.width}
          height={zone.height}
          className={ROLE_FILL[zone.role]}
        />
      ))}
    </svg>
  );
}
