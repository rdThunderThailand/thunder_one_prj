import type { ReactNode } from "react";
import Link from "next/link";
import { ClockIcon, MonitorIcon, UsersIcon, WarningTriangleIcon } from "@/components/ui/icons";
import type { HomeStats } from "../core-mapper";
import { topStatsMock } from "../mock-data";

// Exact tone hex values pulled from the Figma shell mockup (node 396:4595)
// rather than the app's generic Tailwind palette — bypasses the shared
// `Card` component (its default `border-zinc-200` would fight a tone
// border at equal Tailwind specificity) in favor of a hand-built tile.
const TONES = {
  red: { border: "border-[#ffe4e7] dark:border-red-500/20", chipBg: "bg-[#fff0f1] dark:bg-red-500/10", text: "text-[#f42b41] dark:text-red-400" },
  amber: { border: "border-[#f9ebc6] dark:border-amber-500/20", chipBg: "bg-[#fff5df] dark:bg-amber-500/10", text: "text-[#f29a00] dark:text-amber-400" },
  blue: { border: "border-[#e3efff] dark:border-blue-500/20", chipBg: "bg-[#eaf4ff] dark:bg-blue-500/10", text: "text-[#075df7] dark:text-blue-400" },
  green: { border: "border-[#daf5eb] dark:border-emerald-500/20", chipBg: "bg-[#e7faef] dark:bg-emerald-500/10", text: "text-[#09a96d] dark:text-emerald-400" },
} as const;

/** Plain informational caption (no real trend backing it) vs. a colored
 *  signed delta — the Figma mockup itself only tone-colors captions that
 *  carry an actual ↑/↓ arrow; plain captions ("ค้างมา 2 วัน") stay neutral
 *  gray-blue there too, so this isn't a deviation from the design. */
const NEUTRAL_CAPTION = "text-[#6b7a9e] dark:text-zinc-400";

function StatTile({
  tone,
  icon,
  label,
  value,
  valueClassName,
  caption,
}: {
  tone: keyof typeof TONES;
  icon: ReactNode;
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
  caption: ReactNode;
}) {
  const c = TONES[tone];
  return (
    <div
      className={`flex flex-col gap-1 rounded-[10px] border bg-gradient-to-br from-white to-[#f8fbff] p-[18px] dark:from-zinc-900 dark:to-zinc-900 ${c.border}`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.chipBg} ${c.text} [&>svg]:h-6 [&>svg]:w-6`}>
          {icon}
        </span>
        <p className={`text-[15px] font-bold ${c.text}`}>{label}</p>
      </div>
      <p className={`pl-[60px] text-[32px] font-black leading-none tracking-tight ${valueClassName ?? c.text}`}>{value}</p>
      <p className={`pl-[60px] text-sm ${caption ? NEUTRAL_CAPTION : ""}`}>{caption}</p>
    </div>
  );
}

/**
 * Top 4 stat tiles. Only "บุคลากรเข้าใหม่" (`stats.newHiresThisMonth`) is
 * real — see `../core-mapper.ts`'s `computeHomeStats`. The other 3 come
 * from `topStatsMock` (`../mock-data.ts`'s own header comment explains why
 * each stays mock). Captions stay the honest static unit labels this app
 * already used ("รายการ"/"ออนไลน์") rather than the Figma mockup's example
 * "↑ 1 จากเมื่อวาน"-style deltas — no historical snapshot exists to compute
 * a real trend from, same discipline as people/personnel's own stat tiles.
 * Colors/sizing otherwise match the mockup exactly (node 396:4595).
 */
export function HomeStatTilesRow({ stats }: { stats: HomeStats | null }) {
  const attention = topStatsMock.find((t) => t.id === "assets-attention");
  const requests = topStatsMock.find((t) => t.id === "pending-requests");
  const displays = topStatsMock.find((t) => t.id === "displays-online");

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile
        tone="red"
        icon={<WarningTriangleIcon />}
        label={attention?.label}
        value={attention?.value ?? "-"}
        caption="รายการ"
      />
      <StatTile
        tone="amber"
        icon={<ClockIcon />}
        label={requests?.label}
        value={requests?.value ?? "-"}
        caption="รายการ"
      />
      <StatTile
        tone="blue"
        icon={<UsersIcon />}
        label="บุคลากรเข้าใหม่"
        value={stats ? stats.newHiresThisMonth : "-"}
        caption={
          <Link href="/people/new-hires" className="font-medium text-[#075df7] hover:text-[#0748c4] dark:text-blue-400">
            เดือนนี้ →
          </Link>
        }
      />
      <StatTile
        tone="green"
        icon={<MonitorIcon />}
        label={displays?.label}
        value={`${displays?.value ?? "-"}%`}
        valueClassName="text-[#071858] dark:text-zinc-50"
        caption="ออนไลน์"
      />
    </div>
  );
}
