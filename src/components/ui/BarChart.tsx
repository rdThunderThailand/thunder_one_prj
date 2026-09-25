"use client";

import dynamic from "next/dynamic";
import type { BarChartProps } from "./charts/BarChartImpl";

export type { BarDatum } from "./charts/BarChartImpl";

// Lazy recharts — see DonutChart.tsx. The wrapper keeps the caller's
// sizing classes, so the box is in place before the chart loads.
const BarChartImpl = dynamic(() => import("./charts/BarChartImpl").then((m) => m.BarChart), { ssr: false });

export function BarChart(props: BarChartProps) {
  return (
    <div className={props.className}>
      <BarChartImpl
        {...props}
        className="h-full w-full"
      />
    </div>
  );
}
