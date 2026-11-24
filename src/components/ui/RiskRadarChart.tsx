"use client";

import dynamic from "next/dynamic";
import type { RiskRadarChartProps } from "./charts/RiskRadarChartImpl";

export type { RadarAxisPoint } from "./charts/RiskRadarChartImpl";

// Lazy recharts — see DonutChart.tsx.
const RiskRadarChartImpl = dynamic(() => import("./charts/RiskRadarChartImpl").then((m) => m.RiskRadarChart), { ssr: false });

export function RiskRadarChart(props: RiskRadarChartProps) {
  const size = props.size ?? 220;
  return (
    <div
      style={{ width: size, height: size }}
      className={props.className}
    >
      <RiskRadarChartImpl
        {...props}
        className=""
      />
    </div>
  );
}
