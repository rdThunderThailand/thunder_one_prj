import type { LocationHistoryReference } from "../services/asset-assignments-location-history.ts";

/** Begin with the event's recorded endpoint and use the member list only for ancestors. */
export function locationHistoryPath(location: LocationHistoryReference | null,
  locations: ReadonlyMap<string, LocationHistoryReference>): string[] {
  const names: string[] = [];
  const visited = new Set<string>();
  let current = location;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.name) names.push(current.name);
    current = current.parentId ? locations.get(current.parentId) ?? null : null;
  }
  return names.reverse();
}

/** The counter is global and one-based. Convert it to Core's page and an in-page index. */
export function locationHistoryCursor(position: number, pageSize: number, total: number) {
  if (position < 1 || position > total) return null;
  return { page: Math.ceil(position / pageSize), index: (position - 1) % pageSize };
}
