import type { ReactNode } from "react";
import Link from "next/link";
import { ClockIcon, MonitorIcon, UsersIcon, WarningTriangleIcon } from "@/components/ui/icons";
import type { HomeStats } from "../core-mapper";

// Exact tone hex values pulled from the Figma shell mockup (node 396:4595)
// rather than the app's generic Tailwind palette — bypasses the shared
// `Card` component (its default `border-border` would fight a tone
// border at equal Tailwind specificity) in favor of a hand-built tile.
const TONES = {
  red: { border: "border-error/30", chipBg: "bg-error-muted", text: "text-error" },
  amber: { border: "border-warning/30", chipBg: "bg-warning-muted", text: "text-warning" },
  blue: { border: "border-t1-blue-100", chipBg: "bg-accent", text: "text-primary" },
  green: { border: "border-success/30", chipBg: "bg-success-muted", text: "text-t1-green-700" },
} as const;

/** Plain informational caption (no real trend backing it) vs. a colored
 *  signed delta — the Figma mockup itself only tone-colors captions that
 *  carry an actual ↑/↓ arrow; plain captions ("ค้างมา 2 วัน") stay neutral
 *  gray-blue there too, so this isn't a deviation from the design. */
const NEUTRAL_CAPTION = "text-muted-foreground";

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
      className={`flex flex-col gap-1 rounded-[10px] border bg-gradient-to-br from-t1-white to-t1-gray-50 p-[18px] ${c.border}`}
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

/** "86%" of total, or "-" when there's nothing to take a percentage of. */
function onlinePercent(online: number | null, total: number | null): string {
  if (online === null || total === null || total === 0) return "-";
  return `${Math.round((online / total) * 100)}%`;
}

function displaysCaption(online: number | null, total: number | null): string {
  if (total === null) return "ไม่สามารถโหลดข้อมูลได้";
  if (total === 0) return "ยังไม่มีจอในระบบ";
  return `${online} จาก ${total} จอ`;
}

/**
 * Top 4 stat tiles, all from `../core-mapper.ts`'s `HomeStats` (see its doc
 * comment for each source). "คำขอที่รออนุมัติ" has no Core source at all —
 * Thunder Care requests aren't in Core — so it always shows "-" with a
 * "ยังไม่มีข้อมูล" caption rather than a placeholder count. Captions stay
 * plain units, not the mockup's "↑ 1 จากเมื่อวาน" deltas — no historical
 * snapshot exists to compute a real trend from. Colors/sizing match the
 * mockup exactly (node 396:4595).
 *
 * Async: awaits `stats` inside MissionControlPage's `<Suspense>` so the rest
 * of the page paints first (`HomeStatTilesSkeleton` is the fallback).
 */
export async function HomeStatTilesRow({ stats: statsPromise }: { stats: Promise<HomeStats> }) {
  const stats = await statsPromise;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile
        tone="red"
        icon={<WarningTriangleIcon />}
        label="สินทรัพย์ที่ต้องดูแล"
        value={stats.assetsNeedingCare ?? "-"}
        caption={stats.assetsNeedingCare === null ? "ไม่สามารถโหลดข้อมูลได้" : "ซ่อมบำรุง / ติดตั้ง"}
      />
      <StatTile
        tone="amber"
        icon={<ClockIcon />}
        label="คำขอที่รออนุมัติ"
        value="-"
        caption="ยังไม่มีข้อมูล"
      />
      <StatTile
        tone="blue"
        icon={<UsersIcon />}
        label="บุคลากรเข้าใหม่"
        value={stats.newHiresThisMonth ?? "-"}
        caption={
          <Link
            href="/people/new-hires"
            className="font-medium text-primary hover:text-accent-foreground"
          >
            เดือนนี้ →
          </Link>
        }
      />
      <StatTile
        tone="green"
        icon={<MonitorIcon />}
        label="จอแสดงผลออนไลน์"
        value={onlinePercent(stats.displaysOnline, stats.displaysTotal)}
        valueClassName="text-foreground"
        caption={displaysCaption(stats.displaysOnline, stats.displaysTotal)}
      />
    </div>
  );
}
