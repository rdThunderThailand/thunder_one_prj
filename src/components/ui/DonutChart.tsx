"use client";

import dynamic from "next/dynamic";
import type { DonutChartProps } from "./charts/DonutChartImpl";

export type { DonutSegment } from "./charts/DonutChartImpl";

// recharts (~340 KB of client JS) is loaded only when a chart actually
// renders, not with every page that happens to import this module. The
// wrapper reserves the chart's exact box so nothing shifts while it loads.
const DonutChartImpl = dynamic(() => import("./charts/DonutChartImpl").then((m) => m.DonutChart), { ssr: false });

export function DonutChart(props: DonutChartProps) {
  const size = props.size ?? 128;
  return (
    <div
      style={{ width: size, height: size }}
      className={props.className}
    >
      <DonutChartImpl
        {...props}
        className=""
      />
    </div>
  );
}
