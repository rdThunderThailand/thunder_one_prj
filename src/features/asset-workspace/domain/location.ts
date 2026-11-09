// Location master (PO 05 §4.8, 03 §2.1). Core v2 `locations` / `locations/{id}` contract and the tree helpers the
// Locations list, Hierarchy and Child Locations tab share. Checklist: E:\ThunderOne\docs\location\asset-ws-locations-fe-checklist.md
import { LOCATION_STATUS_TONE, type StatusTone } from "./status-tone.ts";

/** Core's labels (`location_type` CHECK). Older rows may hold another value; it is shown as-is. */
export const LOCATION_TYPES = ["Site", "Building", "Floor", "Room", "Area", "Storage"] as const;
export const LOCATION_STATUSES = ["Active", "Inactive"] as const;
export type LocationStatus = (typeof LOCATION_STATUSES)[number];

export interface Location {
  id: string;
  name: string;
  locationType: string | null;
  status: string;
  parentId: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  /** Assets whose own location this is (Disposed not counted, no roll-up). */
  assetCount: number;
  childCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocationDetail extends Location {
  parent: { id: string; name: string } | null;
}

export interface TreeRow extends Location {
  depth: number;
}

const byName = (a: Location, b: Location) => a.name.localeCompare(b.name);

/** Depth-first order, siblings by name. A row whose parent is missing (other tenant, filtered out) starts a root.
 *  Rows caught in a parent loop (blocked in Core, kept safe here) are appended at depth 0. */
export function toTreeRows(locations: Location[]): TreeRow[] {
  const ids = new Set(locations.map((l) => l.id));
  const children = new Map<string | null, Location[]>();
  for (const l of locations) {
    const key = l.parentId && ids.has(l.parentId) ? l.parentId : null;
    children.set(key, [...(children.get(key) ?? []), l]);
  }
  const rows: TreeRow[] = [];
  const seen = new Set<string>();
  const walk = (parent: string | null, depth: number) => {
    for (const l of (children.get(parent) ?? []).sort(byName)) {
      if (seen.has(l.id)) continue;
      seen.add(l.id);
      rows.push({ ...l, depth });
      walk(l.id, depth + 1);
    }
  };
  walk(null, 0);
  for (const l of locations) if (!seen.has(l.id)) rows.push({ ...l, depth: 0 });
  return rows;
}

/** The location and every location below it: not allowed as its new Parent. */
export function selfAndDescendants(locations: Location[], id: string): Set<string> {
  const out = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const l of locations) {
      if (l.parentId && out.has(l.parentId) && !out.has(l.id)) {
        out.add(l.id);
        grew = true;
      }
    }
  }
  return out;
}

export interface LocationFilters {
  q?: string;
  type?: string;
  status?: string;
}

/** Search / Type / Status on the list. A match keeps its ancestors so the tree still reads top-down. */
export function filterLocations(locations: Location[], { q, type, status }: LocationFilters): Location[] {
  const needle = q?.trim().toLowerCase();
  const match = (l: Location) =>
    (!needle || l.name.toLowerCase().includes(needle) || (l.address ?? "").toLowerCase().includes(needle)) &&
    (!type || l.locationType === type) &&
    (!status || l.status === status);
  const matched = locations.filter(match);
  if (!needle && !type && !status) return locations;
  const byId = new Map(locations.map((l) => [l.id, l]));
  const keep = new Set<string>();
  for (const l of matched) {
    let cur: Location | undefined = l;
    while (cur && !keep.has(cur.id)) {
      keep.add(cur.id);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
  }
  return locations.filter((l) => keep.has(l.id));
}

export const locationTone = (status: string): StatusTone =>
  LOCATION_STATUS_TONE[status as LocationStatus] ?? "zinc";

// ── Add / Edit form ──────────────────────────────────────────────────

/** Core v2 create / PATCH body. */
export interface LocationInput {
  name: string;
  locationType: string;
  parentId: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
}

export type LocationForm = Record<keyof LocationInput, string>;
export type LocationFormErrors = Partial<Record<keyof LocationInput, string>>;

const optionalText = (v: string) => (v.trim() === "" ? null : v.trim());
/** "" → null; anything else → Number (NaN when not a number). */
export const parseCoordinate = (v: string) => (v.trim() === "" ? null : Number(v));

/** The rules Core also checks (location_* RPCs), so most mistakes show before a round trip. */
export function validateLocationForm(form: LocationForm): { errors: LocationFormErrors; input?: LocationInput } {
  const errors: LocationFormErrors = {};
  const name = form.name.trim();
  if (!name) errors.name = "Enter a name.";
  else if (name.length > 255) errors.name = "Up to 255 characters.";
  if (!form.locationType) errors.locationType = "Choose a type.";
  if (form.notes.length > 500) errors.notes = "Up to 500 characters.";
  const lat = parseCoordinate(form.latitude);
  const lng = parseCoordinate(form.longitude);
  if ((lat === null) !== (lng === null)) errors.latitude = "Enter both latitude and longitude, or neither.";
  else if (lat !== null && (Number.isNaN(lat) || lat < -90 || lat > 90)) errors.latitude = "Latitude must be -90 to 90.";
  else if (lng !== null && (Number.isNaN(lng) || lng < -180 || lng > 180)) errors.longitude = "Longitude must be -180 to 180.";
  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    input: {
      name,
      locationType: form.locationType,
      parentId: form.parentId || null,
      address: optionalText(form.address),
      latitude: lat,
      longitude: lng,
      notes: optionalText(form.notes),
    },
  };
}
