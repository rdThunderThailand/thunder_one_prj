// Edge snapping for a Zone being dragged or resized on the canvas. It adjusts the pointer
// delta, not the finished rect: a w/n handle moves x and width together, so snapping x after
// the fact would drag the opposite edge along with it.

type Rect = { x: number; y: number; width: number; height: number };
export type SnapHandle = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/** Edge lines (percent) a dragged Zone can stick to: the canvas sides and every other Zone's sides. */
export function snapTargets(others: Rect[]): { x: number[]; y: number[] } {
  return {
    x: [0, 100, ...others.flatMap((zone) => [zone.x, zone.x + zone.width])],
    y: [0, 100, ...others.flatMap((zone) => [zone.y, zone.y + zone.height])],
  };
}

/** Which of the start rect's edges travel with the delta on one axis. */
function movingEdges(start: number, size: number, handle: SnapHandle, low: "w" | "n", high: "e" | "s"): number[] {
  if (handle === "move") return [start, start + size];
  return [...(handle.includes(low) ? [start] : []), ...(handle.includes(high) ? [start + size] : [])];
}

function snapAxis(edges: number[], delta: number, targets: number[], threshold: number) {
  let best: { delta: number; guide: number; distance: number } | null = null;
  for (const edge of edges) {
    for (const target of targets) {
      const distance = Math.abs(edge + delta - target);
      if (distance <= threshold && (!best || distance < best.distance)) {
        best = { delta: target - edge, guide: target, distance };
      }
    }
  }
  return best ? { delta: best.delta, guide: best.guide } : { delta, guide: null };
}

export function snapDelta(
  start: Rect,
  handle: SnapHandle,
  dx: number,
  dy: number,
  targets: { x: number[]; y: number[] },
  threshold: { x: number; y: number },
): { dx: number; dy: number; guideX: number | null; guideY: number | null } {
  const x = snapAxis(movingEdges(start.x, start.width, handle, "w", "e"), dx, targets.x, threshold.x);
  const y = snapAxis(movingEdges(start.y, start.height, handle, "n", "s"), dy, targets.y, threshold.y);
  return { dx: x.delta, dy: y.delta, guideX: x.guide, guideY: y.guide };
}

/** The rect a drag produces from its start rect and (already snapped) percent delta. */
export function computeNextRect(
  start: Rect,
  handle: SnapHandle,
  dxPct: number,
  dyPct: number,
  roundX: (v: number) => number,
  roundY: (v: number) => number
): Rect {
  let { x, y, width, height } = start;
  if (handle === "move") {
    x += dxPct;
    y += dyPct;
  } else {
    if (handle.includes("e")) width += dxPct;
    if (handle.includes("w")) {
      x += dxPct;
      width -= dxPct;
    }
    if (handle.includes("s")) height += dyPct;
    if (handle.includes("n")) {
      y += dyPct;
      height -= dyPct;
    }
  }
  width = Math.max(1, Math.min(100, width));
  height = Math.max(1, Math.min(100, height));
  x = Math.max(0, Math.min(100 - width, x));
  y = Math.max(0, Math.min(100 - height, y));
  return { x: roundX(x), y: roundY(y), width: roundX(width), height: roundY(height) };
}
