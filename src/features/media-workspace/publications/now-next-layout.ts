export function timelineWindow(asOf: string, horizonMinutes: number) {
  const current = new Date(asOf).getTime();
  const quarterHour = 15 * 60_000;
  const start = Math.floor(current / quarterHour) * quarterHour;
  const end = Math.ceil((current + horizonMinutes * 60_000) / quarterHour) * quarterHour;
  return { current, start, end };
}

export function timelinePosition(opensAt: string, closesAt: string | null, asOf: string, horizonMinutes: number) {
  const { start, end } = timelineWindow(asOf, horizonMinutes);
  const opens = Math.max(start, new Date(opensAt).getTime());
  const closes = Math.min(end, closesAt ? new Date(closesAt).getTime() : end);
  const span = end - start;
  return {
    left: Math.max(0, Math.min(100, ((opens - start) / span) * 100)),
    width: Math.max(2, Math.min(100, ((closes - opens) / span) * 100)),
  };
}

export function timelineTicks(asOf: string, horizonMinutes: number) {
  const { start, end } = timelineWindow(asOf, horizonMinutes);
  const quarterHour = 15 * 60_000;
  return Array.from({ length: Math.floor((end - start) / quarterHour) + 1 }, (_, index) => new Date(start + index * quarterHour).toISOString());
}
