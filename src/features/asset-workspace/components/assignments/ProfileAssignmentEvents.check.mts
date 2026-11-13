import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { createElement, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
type Props = Record<string, unknown> & { children?: ReactNode };
type Component = ComponentType<Props>;
const container = ({ children }: Props) => createElement("div", null, children);
const button = ({ children, disabled, "aria-label": label, "aria-current": current }: Props) =>
  createElement("button", { disabled: Boolean(disabled), "aria-label": label as string, "aria-current": current as "page" }, children);
const mocks: Record<string, unknown> = {
  "@/components/ui/Badge": { Badge: ({ children }: Props) => createElement("span", null, children) },
  "@/components/ui/Skeleton": { Skeleton: () => createElement("span", { "aria-hidden": true }) },
  "@/components/ui/Avatar": { Avatar: () => createElement("span", { "aria-hidden": true }) },
  "@/components/ui/lovable/button": { Button: button },
  "@/components/ui/lovable/tabs": {
    Tabs: container, TabsList: container, TabsContent: container, TabsTrigger: button,
  },
  "../asset-profile/ProfileControls": { DisabledHint: container },
  "../asset-profile/ProfileAllHistory": { ProfileAllHistory: container },
  "../asset-profile/ProfileStatusHistory": { ProfileStatusHistory: ({ layout }: Props) =>
    (layout as (content: ReactNode, panel: ReactNode) => ReactNode)(null, null) },
  "../states/states": { EmptyState: ({ title, body }: Props) => createElement("p", null, `${title}: ${body}`) },
  "../asset-profile/ProfileParts": { formatDay: (value: string | null) => value?.slice(0, 10) ?? "—" },
  "./ProfileAssignmentEvents": { ProfileAssignmentEvents: ({ layout }: Props) =>
    (layout as (content: ReactNode, panel: ReactNode) => ReactNode)(null, null) },
  "./ProfileLocationHistory": { ProfileLocationHistory: ({ layout }: Props) =>
    (layout as (content: ReactNode, panel: ReactNode) => ReactNode)(null, null) },
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
const table = load(new URL("./ProfileAssignmentEventsTable.tsx", import.meta.url)).ProfileAssignmentEventsTable;
const loading = load(new URL("./ProfileAssignmentEventsLoading.tsx", import.meta.url)).ProfileAssignmentEventsLoading;
const pager = load(new URL("./ProfileAssignmentPager.tsx", import.meta.url)).ProfileAssignmentPager;
const { ProfileAssignmentHistory, ProfileHistoryLayout } = load(new URL("./ProfileAssignmentHistory.tsx", import.meta.url));
const render = (entry: unknown, props: Props) => renderToStaticMarkup(createElement(entry as Component, props));

const holder = { type: "person", id: "person", name: "Jane Doe", avatarUrl: null };
const row = {
  id: "event", action: "Transfer", at: "2026-11-11T02:00:00Z", from: null, to: holder, performedBy: null,
  condition: "Damaged", location: { name: "Old Room" }, reason: "backfill",
  custodyPeriod: { startedAt: "2026-11-10T02:00:00Z", endedAt: null },
};
const returned = { ...row, action: "Return", to: null, custodyPeriod: null, condition: "Fair" };
const custody = render(table, { history: false, rows: [row, returned], page: 2, currentKey: "Transfer:event" });
assert.match(custody, /Custodian.*>From<.*>To<.*>Location<.*>Action<.*>Notes<.*>By</);
assert.match(custody, /2026-11-10/);
assert.match(custody, /2026-11-11/);
assert.match(custody, /Current/);
assert.match(custody, />21<\/td>/);
assert.match(custody, /Old Room/);
assert.match(custody, /Unassigned/);
assert.match(custody, /title="Jane Doe" class="min-w-0 truncate/);
assert.doesNotMatch(custody, /backfill/);
const history = render(table, { history: true, rows: [row, returned], currentKey: "Transfer:event",
  selectedKey: "Return:event", onSelect() {} });
assert.match(history, /Condition at Return/);
assert.match(history, /aria-sort="descending"/);
assert.match(history, /aria-selected="true"/);
assert.match(history, /title="Jane Doe" class="min-w-0 truncate/);
assert.match(history, /<span>Fair<\/span>/);
assert.doesNotMatch(history, /Damaged|Transaction ID|Asset ID/);
for (const view of [false, true]) {
  const shell = render(loading, { history: view });
  assert.match(shell, /Loading assignment history…/);
  assert.equal((shell.match(/<th\b/g) ?? []).length, view ? 9 : 8);
}

const nav = render(ProfileAssignmentHistory, { context: "tenant:user", asset: { id: "asset" } });
assert.match(nav, /All History.*Assignment History.*Location History.*Status History.*Maintenance History.*File History.*Audit Log/);
assert.match(nav, /<button>Status History<\/button>/);
assert.doesNotMatch(nav, /<p>Status History:/);
for (const label of ["Maintenance History", "File History", "Audit Log"]) {
  assert.match(nav, new RegExp(`<button>${label}</button>`));
  assert.match(nav, new RegExp(`<p>${label}: This view will be available after Lifecycle &amp; Warranty is finished.</p>`));
}
assert.match(nav, /<button>Location History<\/button>/);
assert.equal((nav.match(/<button disabled=""/g) ?? []).length, 0);
const layout = render(ProfileHistoryLayout, { children: "SUBTABS_TABLE", panel: createElement("aside", null, "EVENT_DETAILS") });
assert.match(layout, /SUBTABS_TABLE<\/div><div[^>]*sticky[^>]*><aside>EVENT_DETAILS/);
assert.match(layout, /minmax\(0,3fr\)_minmax\(var\(--container-sm\),2fr\)/);
assert.doesNotMatch(layout, /overflow-x-auto|100vh|100dvh/);

const footer = render(pager, { page: 2, pageSize: 20, total: 25, totalPages: 2, itemLabel: "assignments", onPageChange() {} });
assert.match(footer, /Showing 21 to 25 of 25 assignments/);
assert.match(footer, /aria-current="page"/);
assert.doesNotMatch(footer, /<select|page size/i);
const filters = readFileSync(new URL("./AssignmentsHistoryFilters.tsx", import.meta.url), "utf8");
const events = readFileSync(new URL("./ProfileAssignmentEvents.tsx", import.meta.url), "utf8");
assert.match(events, /<AssignmentsHistoryFilters url=/);
assert.match(filters, /<AssignmentsHistoryDateRange url=\{url\}/);
assert.doesNotMatch(events, /type="date"/);
console.log("Profile history subtabs, event rows, loading, sibling panel, fixed pager and house date picker checks passed");
