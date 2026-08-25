"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

interface LineTrendChartProps {
  data: Record<string, number | string>[];
  series: TrendSeries[];
  xKey: string;
  /** Formats the Y-axis as "128K" instead of "128000". A boolean, not a
   * formatter function, so this stays a plain Server Component prop — a
   * function prop here can't cross the server/client boundary. */
  compactYAxis?: boolean;
  className?: string;
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

// A small multi-series line chart — Recharts under the hood, same pattern
// as Sparkline/DonutChart. Axis/grid colors are hardcoded (light theme only)
// rather than theme-aware, matching DonutChart's tooltip.
export function LineTrendChart({ data, series, xKey, compactYAxis, className = "" }: LineTrendChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#f0f0f2" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={compactYAxis ? formatCompact : undefined}
          />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e4e4e7" }} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
