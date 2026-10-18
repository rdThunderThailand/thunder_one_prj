"use client";

import { Bar, BarChart as RechartsBarChart, LabelList, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export interface BarDatum {
  label: string;
  value: string;
  count: number;
}

export interface BarChartProps {
  data: BarDatum[];
  color?: string;
  className?: string;
}

// A single-series bar chart with a "count (percent)" label above each bar —
// Recharts under the hood, same pattern as DonutChart/LineTrendChart. Axis
// colors are hardcoded (light theme only), matching those two.
export function BarChart({ data, color = "var(--color-primary)", className = "" }: BarChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-t1-gray-400)" }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "var(--color-muted)" }}
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "var(--color-border)" }}
          />
          <Bar dataKey="count" name="Count" fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            <LabelList dataKey="value" position="top" style={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
