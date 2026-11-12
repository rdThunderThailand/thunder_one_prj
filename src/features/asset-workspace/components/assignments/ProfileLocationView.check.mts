import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { createElement, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { LocationHistoryEvent } from "../../services/asset-assignments-location-history.ts";

const require = createRequire(import.meta.url);
type Props = Record<string, unknown> & { children?: ReactNode };
const surface = ({ title, action, children, body }: Props) =>
  createElement("section", null, title as ReactNode, action as ReactNode, body as ReactNode, children);
const at = "2026-11-11T09:00:00+07:00";
const before = "2026-11-10T09:00:00+07:00";
const parent = { id: "head", name: "Head Office", parentId: null, locationType: "Building", address: "Parent address" };
const location = { id: "floor", name: "Floor 3", parentId: parent.id, locationType: "Floor", address: "123 Sukhumvit" };
const latest: LocationHistoryEvent = { id: "move", at, until: null, source: "move", from: null, to: location, performedBy: null, reason: null };
const old: LocationHistoryEvent = { ...latest, id: "register", at: before, until: at, source: "register", to: parent, reason: "Initial location" };
const page = { data: [latest, old], page: 1, pageSize: 20, total: 2, totalPages: 1 };
const asset = { id: "current-asset", location: { id: location.id, name: location.name }, locationPath: [parent, location] };
let eventRead: { result: unknown; pending: boolean } = { result: { ok: true, data: page }, pending: false };
let pathRead: { result: unknown; pending: boolean } = { result: { ok: true, data: [parent, location] }, pending: false };
let nearbyRead: { result: unknown; pending: boolean } = { result: { ok: true, data: { rows: [
  { id: asset.id, name: "Current asset name" },
  { id: "nearby-id", name: "Nearby laptop", thumbnail_url: null, asset_code: "AST-0002", status: "Assigned" },
] } }, pending: false };
const reads = new Map<string, unknown>();
const mocks: Record<string, unknown> = {
  "next/link": { default: ({ href, children }: Props) => createElement("a", { href: href as string }, children) },
  "@/components/ui/Badge": { Badge: ({ children }: Props) => createElement("span", null, children) },
  "@/components/ui/Avatar": { Avatar: () => null },
  "@/components/ui/Skeleton": { Skeleton: () => createElement("span", { "aria-hidden": true }) },
  "@/components/ui/lovable/button": { Button: ({ children, disabled, asChild }: Props) => asChild ? children : createElement("button", { disabled: Boolean(disabled) }, children) },
  "../../hooks/use-asset-profile": { useProfileRead: (key: string, load: (signal: AbortSignal) => void, enabled = true) => {
    if (enabled) load(new AbortController().signal);
    const read = key.endsWith("profile-location-paths") ? pathRead : key.endsWith("nearby-assets") ? nearbyRead : eventRead;
    return { ...read, reload() {} };
  } },
  "../../services/asset-assignments-location-history": {
    getAssetLocationHistory: (context: string, id: string, query: unknown) => reads.set("events", { context, id, query }),
    getLocationHistoryLocations: (context: string) => reads.set("paths", context),
  },
  "../../services/assets-list-api": { getAssetsList: (context: string, query: unknown) => reads.set("nearby", { context, query }) },
  "../asset-profile/ProfileControls": { DisabledHint: ({ children }: Props) => createElement("div", null, children) },
  "../asset-profile/ProfileParts": {
    formatDay: (value: string | null) => value?.slice(0, 10) ?? "—", ProfileSection: surface, SectionMessage: surface,
    StatusValue: ({ status }: Props) => createElement("span", null, status as ReactNode),
    ProfileRows: ({ rows }: Props) => createElement("dl", null,
      (rows as { label: string; value: string }[]).map(({ label, value }) =>
        createElement("div", { key: label }, createElement("dt", null, label), createElement("dd", null, value)))),
  },
  "../states/ErrorState": { ErrorState: surface },
  "../states/states": { AccessDeniedState: surface, EmptyState: surface, NotFoundState: surface },
  "../AssetThumbnail": { AssetThumbnail: ({ src, alt }: Props) => createElement("span", { "data-src": src as string }, alt as string) },
};
const modules = new Map<string, Record<string, unknown>>();
function load(url: URL): Record<string, unknown> {
  const cached = modules.get(url.href);
  if (cached) return cached;
  const exports: Record<string, unknown> = {};
  modules.set(url.href, exports);
  const source = ts.transpileModule(readFileSync(url, "utf8"), { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  vm.runInNewContext(source, { exports, URLSearchParams, AbortController, require: (id: string) => {
    if (id in mocks) return mocks[id];
    if (id === "@/components/ui/icons") return new Proxy({}, { get: () => () => null });
    if (id.startsWith("../../domain/")) return require(fileURLToPath(new URL(`${id}.ts`, url)));
    if (id.startsWith(".")) return load(new URL(`${id}.tsx`, url));
    return require(id);
  } });
  return exports;
}
const view = load(new URL("./ProfileLocationView.tsx", import.meta.url)).ProfileLocationView as ComponentType<Props>;
const render = (value: { id: string; location: typeof asset.location | null; locationPath: typeof asset.locationPath } = asset) =>
  renderToStaticMarkup(createElement(view, { context: "tenant:user", asset: value }));

const screen = render();
assert.match(screen, /Current Location.*Head Office.*Floor 3.*Location Photos.*Location History.*Nearby Assets/);
assert.match(screen, /<button disabled="">Edit Location<\/button>/);
assert.deepEqual([...screen.matchAll(/<th\b[^>]*>(.*?)<\/th>/g)].map((match) => match[1]), ["#", "Location", "From", "To", "By", "Notes"]);
assert.match(screen, /Head Office › Floor 3/);
for (const label of ["Building", "Floor", "Area", "Room \/ Zone", "Address"]) assert.match(screen, new RegExp(`${label}</dt><dd>—</dd>`));
assert.match(screen, /aria-disabled="true".*Location details: Not supported in this version\./);
assert.match(screen, /Location Photos<div aria-disabled="true"[^>]*><section>Location photos: Not supported in this version\./);
assert.doesNotMatch(screen, /123 Sukhumvit|Parent address/);
assert.match(screen, /2026-11-11<\/td><td[^>]*>—<\/td>/);
assert.match(screen, /System/);
assert.equal((screen.match(/Current location/g) ?? []).length, 1);
assert.match(screen, /Showing 1 to 2 of 2 records/);
assert.match(screen, /href="\/asset-workspace\/assets\?location_id=floor"/);
assert.match(screen, /Location Map.*aria-disabled="true".*Map is not available in this version\./);
assert.match(screen, /Nearby laptop/);
assert.doesNotMatch(screen, /Current asset name|Location Code/);
assert.deepEqual(JSON.parse(JSON.stringify(reads.get("events"))), { context: "tenant:user", id: asset.id, query: { page: 1, pageSize: 20 } });
assert.equal(reads.get("paths"), "tenant:user");
assert.deepEqual(JSON.parse(JSON.stringify(reads.get("nearby"))), { context: "tenant:user", query: { page: 1, pageSize: 5, sort: "created_at", location_id: "floor" } });
reads.delete("nearby");
assert.match(render({ ...asset, location: null, locationPath: [] }), /No location assigned\./);
assert.equal(reads.has("nearby"), false);

eventRead = { result: { ok: true, data: { ...page, page: 2, total: 22, totalPages: 2 } }, pending: false };
assert.doesNotMatch(render(), /Current location/);
pathRead = { result: { ok: false, message: "diagnostics" }, pending: false };
assert.match(render(), /Couldn&#x27;t load the location path/);
assert.match(render(), /Head Office/);
eventRead = { result: { ok: false, code: "PERMISSION_DENIED", message: "diagnostics" }, pending: false };
assert.match(render(), /You don&#x27;t have access/);
assert.doesNotMatch(render(), /diagnostics/);
eventRead = { result: null, pending: true };
nearbyRead = { result: null, pending: true };
assert.match(render(), /Loading location history…/);
assert.match(render(), /Loading nearby assets…/);
console.log("Profile Location paths, intervals, badge, scoped nearby query, empty and loading states passed");
