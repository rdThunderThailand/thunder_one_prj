"use client";

import dynamic from "next/dynamic";
import type { SparklineProps } from "./charts/SparklineImpl";

// Lazy recharts — see DonutChart.tsx. The wrapper keeps the caller's
// sizing classes, so the box is in place before the chart loads.
const SparklineImpl = dynamic(() => import("./charts/SparklineImpl").then((m) => m.Sparkline), { ssr: false });

export function Sparkline(props: SparklineProps) {
  if (props.data.length < 2) return null;
  return (
    <div className={props.className}>
      <SparklineImpl
        {...props}
        className="h-full w-full"
      />
    </div>
  );
}
