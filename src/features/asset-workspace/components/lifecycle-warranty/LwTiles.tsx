import type { ReactNode } from "react";
import { StatTile } from "@/components/ui/StatTile";
import type { StatusTone } from "../../domain/status-tone";

// StatTile colour per status tone, as AssetsSummary (ADR 0098 §3).
const tileColor = {
  green: "emerald", blue: "blue", yellow: "amber", red: "red", zinc: "zinc",
} as const satisfies Record<StatusTone, string>;
const number = new Intl.NumberFormat("en-GB");

export type LwTile = { key: string; label: string; count: number | null; tone: StatusTone; icon: ReactNode; onClick: () => void };

/** Four count tiles; a click toggles the tile's filter (Q5: no highlight, so no pressed state is shown). */
export function LwTiles({ label, tiles, disabled }: { label: string; tiles: LwTile[]; disabled: boolean }) {
  return (
    <section aria-label={label} className="grid grid-cols-2 gap-3 @4xl/lw:grid-cols-4">
      {tiles.map((tile) => (
        <button
          key={tile.key}
          type="button"
          disabled={disabled}
          onClick={tile.onClick}
          aria-label={`${tile.label}: ${tile.count === null ? "not available" : number.format(tile.count)}. Filter the list.`}
          className="rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait [&>*]:h-full"
        >
          <StatTile
            label={tile.label}
            value={tile.count === null ? "—" : number.format(tile.count)}
            color={tileColor[tile.tone]}
            icon={tile.icon}
          />
        </button>
      ))}
    </section>
  );
}
