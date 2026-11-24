"use client";

import dynamic from "next/dynamic";
import type { LineTrendChartProps } from "./charts/LineTrendChartImpl";

export type { TrendSeries } from "./charts/LineTrendChartImpl";

// Lazy recharts — see DonutChart.tsx. The wrapper keeps the caller's
// sizing classes, so the box is in place before the chart loads.
const LineTrendChartImpl = dynamic(() => import("./charts/LineTrendChartImpl").then((m) => m.LineTrendChart), { ssr: false });

export function LineTrendChart(props: LineTrendChartProps) {
  return (
    <div className={props.className}>
      <LineTrendChartImpl
        {...props}
        className="h-full w-full"
      />
    </div>
  );
}
