// One KPI tile for the session tabs (Assets, Discrepancies, Activity): a large icon, number, label, one muted line.
// Colours come from the caller, from the status tone maps (status-tone.ts); use `toneTile` for a status tone.
import type { ReactNode } from "react";
import { TONE_ICON, TONE_SOFT, type StatusTone } from "../../domain/status-tone";

/** Tint and icon colour of a status tone. */
export const toneTile = (tone: StatusTone) => ({ tint: TONE_SOFT[tone], iconClass: TONE_ICON[tone] });

export function KpiTile({ icon, iconClass, tint, value, label, note, className = "" }: {
  icon: ReactNode;
  /** Text colour of the icon. */
  iconClass: string;
  /** Background of the tile. */
  tint: string;
  value: number;
  label: string;
  note?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-xl p-4 ${tint} ${className}`}>
      <span
        aria-hidden="true"
        className={`flex h-12 w-12 shrink-0 items-center justify-center [&>span]:size-9 ${iconClass}`}
      >
        {icon}
      </span>
      <p className="min-w-0 leading-snug">
        <span className="block text-2xl font-semibold tabular-nums">{value.toLocaleString()}</span>
        <span className="block text-sm font-medium">{label}</span>
        {note && <span className="block text-sm text-muted-foreground">{note}</span>}
      </p>
    </div>
  );
}
