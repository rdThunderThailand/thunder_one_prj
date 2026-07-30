"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function DonutChart({
  segments,
  size = 128,
  strokeWidth = 18,
  className = "",
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const outerRadius = size / 2;
  const innerRadius = Math.max(outerRadius - strokeWidth, 0);

  return (
    <div
      style={{ width: size, height: size }}
      className={className}
      role="img"
      aria-label="Distribution chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={segments}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={90}
            endAngle={-270}
            paddingAngle={segments.length > 1 ? 2 : 0}
            stroke="#ffffff"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {segments.map((segment) => (
              <Cell key={segment.label} fill={segment.color} />
            ))}
          </Pie>
          {/* Per-slice hover tooltip — the donut is a proper standalone chart
              (unlike the inline stat-card sparklines), so it gets the
              interactive layer by default. */}
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const segment = payload[0].payload as DonutSegment;
              const percent = ((segment.value / total) * 100).toFixed(1);
              return (
                <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md">
                  <p className="flex items-center gap-1.5 font-medium text-zinc-900">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    {segment.label}
                  </p>
                  <p className="mt-0.5 text-zinc-500">
                    {segment.value} ({percent}%)
                  </p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
