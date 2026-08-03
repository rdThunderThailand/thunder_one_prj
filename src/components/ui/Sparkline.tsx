"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  className?: string;
}

// Color comes from the wrapping element's text color (`currentColor`), e.g.
// `text-indigo-500` — SVG paint attributes accept it directly, so Recharts
// needs no color prop of its own to stay theme-consistent with the stat card
// badge it sits beside.
export function Sparkline({ data, className = "" }: SparklineProps) {
  const gradientId = useId();

  if (data.length < 2) return null;

  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="currentColor"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
