/** Reserve controls and two actual row heights before bounding Assignments. */
export function listViewportMetrics(input: {
  viewportBottom: number; top: number; bottomPadding: number;
  fixedHeight: number; gaps: number; cardChrome: number; footer: number;
  heading: number; row: number;
}) {
  const height = Math.max(0, Math.floor(input.viewportBottom - input.top - input.bottomPadding));
  const availableRows = height - input.fixedHeight - input.gaps - input.cardChrome - input.footer - input.heading;
  return { height, bounded: availableRows >= input.row * 2 };
}
