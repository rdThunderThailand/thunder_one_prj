import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { cloneElement, createElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HISTORY_COLUMNS } from "../../domain/assignment-history.ts";

// Exercise the real feature JSX and simple approved primitives. Browser/focus/layout remain separate checks.
const require = createRequire(import.meta.url);
type Props = Record<string, unknown> & { children?: ReactNode };
type Component = (props: Props) => ReactElement;
const button: Component = ({ children, asChild, ...props }) => {
  delete props.variant;
  delete props.size;
  return asChild ? cloneElement(children as ReactElement, props) : createElement("button", props, children);
};
const ui = new URL("../../../../components/ui/", import.meta.url);
const modules = new Map<string, Record<string, unknown>>();
function load(url: URL): Record<string, unknown> {
  if (modules.has(url.href)) return modules.get(url.href)!;
  const exports: Record<string, unknown> = {};
  modules.set(url.href, exports);
  const code = ts.transpileModule(readFileSync(url, "utf8"), { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  vm.runInNewContext(code, { exports, Date, setTimeout, clearTimeout, require: (id: string) => {
    if (id === "next/link") return { default: (props: Props) => createElement("a", props, props.children) };
    if (id.endsWith("/button")) return { Button: button };
    if (id.endsWith("/icons")) return Object.fromEntries(["XIcon", "PlusIcon", "ChevronLeftIcon", "ChevronRightIcon",
      "BoxIcon", "LockIcon", "SearchIcon", "AlertCircleIcon", "RefreshIcon"].map((key) => [key, () => createElement("span", { "aria-hidden": true })]));
    if (id === "next/navigation") return { useRouter: () => ({ refresh() {} }) };
    if (id.endsWith("/PageHeader")) return { PageHeader: ({ title }: Props) => createElement("h1", null, title as ReactNode) };
    if (id.endsWith("/useListUrlState")) return { useListUrlState: () => ({ get: (key: string) => key === "tab" ? "history" : undefined, set() {}, isPending: false }) };
    if (id === "./AssignmentsWorkspace") return { AssignmentsWorkspace: ({ children }: Props) => createElement("div", null, children) };
    if (id === "./AssignmentsHistoryFilters") return { AssignmentsHistoryFilters: () => createElement("div") };
    if (id.startsWith("@/components/ui/")) return load(new URL(`${id.split("/").at(-1)}.tsx`, ui));
    if (id.startsWith("../../domain/")) return require(fileURLToPath(new URL(`${id}.ts`, url)));
    if (id.startsWith(".")) return load(new URL(`${id}${id.endsWith("columns") || id.endsWith("error-text") ? ".ts" : ".tsx"}`, url));
    return require(id);
  } });
  return exports;
}
const { AssignmentsHistoryTable } = load(new URL("./AssignmentsHistoryTable.tsx", import.meta.url));
const { AssignmentsHistoryPanel } = load(new URL("./AssignmentsHistoryPanel.tsx", import.meta.url));
const { AssignmentsHistoryLoading } = load(new URL("./AssignmentsHistoryLoading.tsx", import.meta.url));
const { AssignmentsHistoryView } = load(new URL("./AssignmentsHistoryView.tsx", import.meta.url));
const { AssignmentsResults } = load(new URL("./AssignmentsResults.tsx", import.meta.url));
const { AssignmentHistoryPerson } = load(new URL("./AssignmentsHistoryValues.tsx", import.meta.url));
const render = (entry: unknown, props = {}) => renderToStaticMarkup(createElement(entry as Component, props));
const id = "c1111111-1111-1111-1111-111111111111";
const event = { id, action: "Return", at: "2026-11-10T01:00:00Z", asset: { id, name: "Laptop One", assetTag: "AST-001" },
  from: { id, type: "person", name: "Jane Doe", avatarUrl: "https://images.example/avatar.jpg" }, to: null,
  performedBy: null, location: null, condition: "Good", reason: "backfill", evidence: [] };
const table = render(AssignmentsHistoryTable, { rows: [event], page: 3, pageSize: 20, selectedKey: `Return:${id}`, onSelect() {} });
const headerText = [...table.matchAll(/<th\b[^>]*>(.*?)<\/th>/g)].map((match) => match[1].replace(/<[^>]*>/g, "").replaceAll("&amp;", "&"));
assert.deepEqual(headerText, HISTORY_COLUMNS.map((name) => name === "Date & Time" ? `${name} ↓` : name));
assert.match(table, /aria-sort="descending"/);
assert.match(table, /<td>41<\/td>/);
assert.match(table, /Unassigned/);
assert.match(table, /System/);
assert.match(table, /JD/);
assert.match(table, /images.example\/avatar.jpg/);
assert.match(table, /min-w-6xl/);
assert.match(table, /whitespace-nowrap[^>]*>Return<\/span>/);
assert.match(table, /whitespace-nowrap[^>]*>Good<\/span>/);
for (const fallback of ["Unassigned", "System", "—"]) {
  assert.equal(render(AssignmentHistoryPerson, { person: null, fallback }), `<span>${fallback}</span>`);
  assert.equal(render(AssignmentHistoryPerson, { person: { name: null, avatarUrl: null }, fallback }), `<span>${fallback}</span>`);
}
const initials = render(AssignmentHistoryPerson, { person: { name: "Jane Doe", avatarUrl: null } });
assert.match(initials, /JD/);
assert.match(initials, /rounded-full/);
assert.match(table, /aria-selected="true"/);
assert.match(table, /bg-accent/);
assert.doesNotMatch(table, /backfill|checkbox|Transaction ID|Current<|Department|Organizational Unit/);
const assignment = render(AssignmentsHistoryTable, { rows: [{ ...event, action: "Assign" }], page: 1, pageSize: 20, onSelect() {} });
assert.match(assignment, />Assignment<\/span>/);
const panelProps = { event, expiresAt: "2099-11-10T02:00:00Z", onClose() {}, onRefresh() {}, refreshing: false };
const panel = render(AssignmentsHistoryPanel, panelProps);
const labels = ["Assignment Event Details", "Date &amp; Time", "Performed By", "From Custodian", "To Custodian", "Location",
  "Condition at Return", "Notes / Reason", "Evidence", "Related Information", "Asset Name", "Asset Tag"];
let last = -1;
for (const label of labels) {
  const position = panel.indexOf(label);
  assert.ok(position > last, `Panel field order: ${label}`);
  last = position;
}
assert.match(panel, /Close event details/);
assert.match(panel, /data-list-aside="true" role="complementary"/);
assert.match(panel, /rounded-xl border border-border bg-card shadow-panel/);
assert.match(panel, /group-data-\[bounded=true\]\/list-viewport:overflow-y-auto/);
assert.doesNotMatch(panel, /sticky top-0|self-start|overflow-x-auto/);
assert.match(panel, /No evidence attached\./);
assert.match(panel, /Condition at Return<\/dt><dd[^>]*><span[^>]*>Good<\/span>/);
for (const row of [
  { ...event, action: "Assign" },
  { ...event, action: "Transfer" },
  { ...event, condition: null },
]) {
  const historyRow = render(AssignmentsHistoryTable, { rows: [row], page: 1, pageSize: 20, onSelect() {} });
  const cells = [...historyRow.matchAll(/<td\b[^>]*>(.*?)<\/td>/g)];
  assert.equal(cells[HISTORY_COLUMNS.indexOf("Condition at Return")]?.[1], "<span>—</span>");
  const details = render(AssignmentsHistoryPanel, { ...panelProps, event: row });
  assert.match(details, /Condition at Return<\/dt><dd[^>]*><span>—<\/span>/);
}
assert.doesNotMatch(panel, new RegExp(id));
assert.doesNotMatch(panel, /Asset ID|Category|Transaction ID|backfill/);
const file = { fileId: id, filename: "handover.pdf", mimeType: "application/pdf", sizeBytes: 10,
  uploadedAt: event.at, url: "https://files.example/evidence" };
const linked = render(AssignmentsHistoryPanel, { ...panelProps, event: { ...event, evidence: [file] } });
assert.match(linked, /href="https:\/\/files.example\/evidence"/);
const unavailable = render(AssignmentsHistoryPanel, { ...panelProps, event: { ...event, evidence: [{ ...file, url: null }] } });
assert.match(unavailable, /File unavailable\. Refresh history to try again\./);
assert.doesNotMatch(unavailable, /<a\b[^>]*href=/);
const expired = render(AssignmentsHistoryPanel, { ...panelProps, expiresAt: "2020-01-01T00:00:00Z", event: { ...event, evidence: [file] } });
assert.match(expired, /File links have expired\. Refresh history to download\./);
assert.doesNotMatch(expired, /<a\b[^>]*href=/);
const loading = render(AssignmentsHistoryLoading);
assert.equal((loading.match(/<th\b/g) ?? []).length, 10);
assert.equal((loading.match(/<tr>/g) ?? []).length, 6);
assert.match(loading, /Loading assignment history…/);
assert.match(loading, /aria-hidden="true"/);
assert.match(loading, /min-w-6xl/);
assert.deepEqual([...loading.matchAll(/<col class="([^"]+)"/g)].map((match) => match[1]),
  [...table.matchAll(/<col class="([^"]+)"/g)].map((match) => match[1]));
const emptyPage = { data: [], page: 1, pageSize: 20, total: 0, totalPages: 0, expiresAt: panelProps.expiresAt };
const viewProps = { query: { page: 1, pageSize: 20 }, filtered: false, result: { ok: true, data: emptyPage } };
const view = (props = {}) => render(AssignmentsHistoryView, { ...viewProps, ...props });
assert.match(view(), /No assignment history/);
assert.match(view({ filtered: true }), /No matching assignment history/);
assert.match(view({ result: { ok: true, data: { ...emptyPage, page: 3, total: 1, totalPages: 1 } } }), /Go to first page/);
for (const [code, title] of [["PERMISSION_DENIED", "You don&#x27;t have access"], ["UNAUTHENTICATED", "Sign in required"],
  ["NOT_FOUND", "Assignments unavailable"], ["VALIDATION", "Check assignment filters"], ["INTERNAL", "Couldn&#x27;t load assignments"]]) {
  assert.ok(view({ result: { ok: false, code } }).includes(title), `${code} exact read state`);
}
const loadedView = view({ result: { ok: true, data: { ...emptyPage, data: [event], total: 1, totalPages: 1 } } });
assert.match(loadedView, /Showing 1 to 1 of 1 assignment history records/);
assert.match(loadedView, /value="10"/);
assert.match(loadedView, /value="20"/);
assert.match(loadedView, /value="25"/);
assert.match(loadedView, /value="50"/);
assert.doesNotMatch(loadedView, /value="100"/);
const fixture = {
  children: createElement("div", null, "TABLE_BODY"),
  footer: createElement("span", null, "TABLE_PAGER"),
  tab: "history",
};
const beside = render(AssignmentsResults, { ...fixture, aside: createElement("aside", null, "EVENT_PANEL") });
// The table scroller and its pager close before the sibling panel starts.
assert.match(beside, /TABLE_BODY<\/div><\/div><div data-list-controls/);
assert.match(beside, /TABLE_PAGER<\/span><\/fieldset><\/div><\/div><aside>EVENT_PANEL<\/aside>/);
assert.equal((beside.match(/data-list-results=/g) ?? []).length, 1);
assert.equal((beside.match(/aria-label="Assignment results"/g) ?? []).length, 1);
assert.match(beside, /data-list-table="true"/);
assert.match(beside, /@5xl\/assignments:grid-cols-\[minmax\(0,1fr\)_var\(--container-xs\)\]/);
assert.match(beside, /grid-rows-\[minmax\(0,1fr\)_minmax\(0,1fr\)\]/);
const closed = render(AssignmentsResults, { ...fixture, aside: null });
assert.match(closed, /data-list-table="true"/);
assert.match(closed, /class="grid min-w-0/);
assert.doesNotMatch(closed, /EVENT_PANEL/);
const current = render(AssignmentsResults, { ...fixture, tab: "current" });
assert.match(current, /^<div class="rounded-xl[^>]*data-list-results="true" id="assignments-panel" role="tabpanel" aria-labelledby="assignments-tab-current">/);
assert.doesNotMatch(current, /data-list-table|class="grid min-w-0/);
assert.match(current, /TABLE_PAGER/);
console.log("History headings, selection, names, panel order, hidden ids, evidence and loading render checks passed");
