import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { createElement, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { LocationHistoryEvent, LocationHistoryPage, LocationHistoryReference } from "../../services/asset-assignments-location-history.ts";
import type { ProfileReadResult } from "../../services/asset-profile-api";

const require = createRequire(import.meta.url);
type Props = Record<string, unknown> & { children?: ReactNode };
const card = ({ children, role, "aria-label": label }: Props) => createElement("div", { role: role as string, "aria-label": label as string }, children);
const button = ({ children, disabled, "aria-label": label, "aria-disabled": ariaDisabled }: Props) =>
  createElement("button", { disabled: Boolean(disabled), "aria-label": label as string, "aria-disabled": ariaDisabled as boolean }, children);
const state = ({ title, body, action }: Props) =>
  createElement("div", null, title as ReactNode, body as ReactNode, action as ReactNode);
const at = "2026-11-11T09:00:00+07:00";
const parent = { id: "head", name: "Head Office", parentId: null };
const from = { id: "room", name: "IT Storage", parentId: parent.id };
const to = { id: "floor 3", name: "Floor 3", parentId: parent.id };
const move: LocationHistoryEvent = { id: "move", source: "move", at, from, to, until: null, reason: "Bench check",
  performedBy: { id: "actor", name: "Jane Doe" } };
const initial: LocationHistoryEvent = { ...move, id: "register", source: "register", from: null, performedBy: null, reason: null };
const page = { data: [move, initial], page: 1, pageSize: 20, total: 2, totalPages: 1 };
let eventResult: ProfileReadResult<LocationHistoryPage> | null = { ok: true, data: page };
let pathResult: ProfileReadResult<LocationHistoryReference[]> = { ok: true, data: [parent] };
const mocks: Record<string, unknown> = {
  "next/link": { default: ({ href, className, children }: Props) =>
    createElement("a", { href: href as string, className: className as string }, children) },
  "@/components/ui/Badge": { Badge: ({ className, children }: Props) =>
    createElement("span", { className: className as string }, children) },
  "@/components/ui/Avatar": { Avatar: ({ name }: Props) => createElement("span", null, String(name).split(" ").map((word) => word[0]).join("")) },
  "@/components/ui/Card": { Card: card },
  "@/components/ui/Skeleton": { Skeleton: () => createElement("span", { "aria-hidden": true }) },
  "@/components/ui/lovable/button": { Button: button },
  "../../hooks/use-asset-profile": { useProfileRead: (key: string) => ({
    result: key.endsWith("history-location-paths") ? pathResult : eventResult, pending: !eventResult, reload() {},
  }) },
  "../../services/asset-assignments-location-history": { getAssetLocationHistory() {}, getLocationHistoryLocations() {} },
  "../states/ErrorState": { ErrorState: state },
  "../states/states": { AccessDeniedState: state, EmptyState: state, NotFoundState: state },
  "../asset-profile/ProfileParts": {
    formatDay: (value: string | null) => value?.slice(0, 10) ?? "—",
    SectionMessage: ({ children }: Props) => createElement("p", null, children),
  },
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
  vm.runInNewContext(source, { exports, require: (id: string) => {
    if (id in mocks) return mocks[id];
    if (id === "@/components/ui/icons") return new Proxy({}, { get: () => () => null });
    if (id.startsWith("../../domain/")) return require(fileURLToPath(new URL(`${id}.ts`, url)));
    if (id.startsWith(".")) return load(new URL(`${id}.tsx`, url));
    return require(id);
  } });
  return exports;
}
const { ProfileLocationHistory } = load(new URL("./ProfileLocationHistory.tsx", import.meta.url));
const { ProfileLocationHistoryPanel } = load(new URL("./ProfileLocationHistoryPanel.tsx", import.meta.url));
const render = (component: unknown, props: Props) =>
  renderToStaticMarkup(createElement(component as ComponentType<Props>, props));
const view = (enabled = true) => render(ProfileLocationHistory, {
  context: "tenant:user", assetId: "asset", enabled,
  layout: (content: ReactNode, panel: ReactNode) => createElement("div", null, content, panel),
});

const screen = view();
const columns = [...screen.matchAll(/<th\b[^>]*>(.*?)<\/th>/g)].map((match) => match[1].replace("&amp;", "&"));
assert.deepEqual(columns, ["#", "Date & Time", "From Location", "To Location", "By", "Reason"]);
assert.match(screen, /Track all location changes for this asset\./);
assert.match(screen, /aria-selected="true"[^>]*><td[^>]*>1<\/td>/);
assert.match(screen, /Location Change Detail/);
assert.match(screen, /1 \/ 2/);
assert.match(screen, /href="\/asset-workspace\/locations\/floor%203"/);
assert.match(screen, /<a[^>]*class="[^"]*inline-flex[^"]*whitespace-nowrap[^"]*"[^>]*>View Location/);
assert.match(screen, /Head Office › Floor 3/);
assert.match(screen, /JD.*Jane Doe/);
assert.match(screen, /System/);
assert.match(screen, /Showing 1 to 2 of 2 records/);
assert.match(screen, /Location Map \(To Location\).*aria-disabled="true".*Map is not available in this version\./);
assert.doesNotMatch(screen, /Export|Close|<select|Department|Date Range/);
assert.equal(view(false), "<div></div>");

const detail = (event: LocationHistoryEvent | null, position: number, pending = false) =>
  render(ProfileLocationHistoryPanel, { event, position, total: 2, locations: new Map(), pending, onStep() {} });
assert.match(detail(move, 1), /Previous location change" aria-disabled="true"/);
assert.match(detail(move, 1), /Next location change" aria-disabled="false"/);
assert.match(detail(initial, 2), /Next location change" aria-disabled="true"/);
assert.match(detail(initial, 2), /class="whitespace-nowrap">Initial location/);
assert.match(detail(initial, 2), /class="flex min-w-0 items-center justify-between gap-2"><h2/);
assert.match(detail(initial, 2), /class="flex shrink-0 items-center gap-2".*2 \/ 2/);
assert.match(detail({ ...move, source: "transfer" }, 1), /Transfer/);
assert.doesNotMatch(detail({ ...move, to: null }, 1), /View Location/);
assert.match(detail(null, 2, true), /Loading location change…/);

pathResult = { ok: false, status: 503, message: "diagnostics" };
assert.match(view(), /Couldn&#x27;t load the location path/);
assert.match(view(), /IT Storage/);
assert.doesNotMatch(view(), /diagnostics/);
eventResult = { ok: true, data: { ...page, data: [], total: 0, totalPages: 0 } };
assert.match(view(), /No location history/);
assert.doesNotMatch(view(), /Location Change Detail/);
eventResult = { ok: false, status: 403, code: "PERMISSION_DENIED", message: "diagnostics" };
assert.match(view(), /You don&#x27;t have access/);
assert.doesNotMatch(view(), /diagnostics/);
eventResult = null;
assert.match(view(), /Loading location history…/);
assert.match(view(), /Loading location change…/);
console.log("Location History columns, initial selection, detail, ancestry fallback, paging controls and states passed");
