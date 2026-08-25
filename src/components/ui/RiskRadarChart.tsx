"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

export interface RadarAxisPoint {
  axis: string;
  current: number;
  previous: number;
}

interface RiskRadarChartProps {
  data: RadarAxisPoint[];
  size?: number;
  className?: string;
}

// A two-series radar/spider chart (current vs. a prior baseline) — Recharts
// under the hood, same pattern as Sparkline/DonutChart. Colors hardcoded
// (light theme only), matching DonutChart's tooltip.
export function RiskRadarChart({ data, size = 220, className = "" }: RiskRadarChartProps) {
  return (
    <div style={{ width: size, height: size }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="#e4e4e7" />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: "#71717a" }} />
          <Radar
            name="Last month"
            dataKey="previous"
            stroke="#a1a1aa"
            strokeDasharray="4 3"
            fill="transparent"
            isAnimationActive={false}
          />
          <Radar
            name="Current"
            dataKey="current"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.25}
            isAnimationActive={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
