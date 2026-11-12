import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { cloneElement, createElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Exercise the feature's actual table/menu/loading JSX with adapters at shared UI boundaries.
// This does not claim to verify Radix focus behavior or rendered viewport geometry.
const require = createRequire(import.meta.url);
type Props = Record<string, unknown> & { children?: ReactNode };
type Component = (props: Props) => ReactElement;
const group: Component = ({ children }) => createElement("div", null, children);
const item: Component = ({ asChild, disabled, children }) => asChild
  ? cloneElement(children as ReactElement<Props>, { role: "menuitem" })
  : createElement("div", { role: "menuitem", "aria-disabled": disabled }, children);
const button: Component = ({ children, asChild, ...props }) => {
  delete props.variant;
  delete props.size;
  return asChild ? cloneElement(children as ReactElement, props)
    : createElement("button", { ...props, type: "button" }, children);
};
const icon: Component = () => createElement("span", { "aria-hidden": true });
const modules = new Map<string, Record<string, unknown>>();

function load(name: string): Record<string, unknown> {
  if (modules.has(name)) return modules.get(name)!;
  const exports: Record<string, unknown> = {};
  modules.set(name, exports);
  const source = readFileSync(new URL(name, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  vm.runInNewContext(compiled, { exports, require: (id: string) => {
    if (id === "next/link") return { default: (props: Props) => createElement("a", props, props.children) };
    if (id === "next/navigation") return { useRouter: () => ({ refresh() {} }) };
    if (id.endsWith("/Avatar")) return { Avatar: icon };
    if (id.endsWith("/AssetThumbnail")) return { AssetThumbnail: (props: Props) => createElement("img", { src: props.src || undefined, alt: "" }) };
    if (id.endsWith("/button")) return { Button: button };
    if (id.endsWith("/Skeleton")) return { Skeleton: (props: Props) => createElement("span", props) };
    if (id.endsWith("/icons")) return { UsersIcon: icon, EyeIcon: icon, MoreIcon: icon, ReturnIcon: icon, TransferIcon: icon };
    if (id.endsWith("/dropdown-menu")) return {
      DropdownMenu: group, DropdownMenuTrigger: group, DropdownMenuContent: group, DropdownMenuItem: item,
    };
    if (id.startsWith("../../domain/")) return require(new URL(`${id}.ts`, import.meta.url).pathname.replace(/^\/(\w:)/, "$1"));
    if (id.startsWith("./")) return load(`${id}${id.endsWith("columns") ? ".ts" : ".tsx"}`);
    return require(id);
  } });
  return exports;
}

const { AssignmentsTable } = load("./AssignmentsTable.tsx");
const { AssignmentsTableLoading } = load("./AssignmentsTableLoading.tsx");
const { AssignmentsTabs } = load("./AssignmentsTabs.tsx");
const id = "c1111111-1111-1111-1111-111111111111";
const row = {
  assignmentId: id, assignedAt: "2026-11-09T18:30:00Z",
  custodian: { type: "org_unit", id, name: "Facilities", avatarUrl: null, department: null },
  location: null,
  asset: { id, name: "Test laptop", assetTag: "AST-001", category: { id, name: "Electronics" },
    thumbnailUrl: null, lifecycleStatus: "Assigned", condition: "Good" },
};
const render = (entry: unknown, props = {}) => renderToStaticMarkup(createElement(entry as Component, props));
const html = render(AssignmentsTable, { rows: [row] });
const headers = ["Asset", "Asset Tag", "Category", "Current Custodian", "Location", "Assigned Date"];
let previous = -1;
for (const header of headers) {
  const position = html.indexOf(`>${header}</th>`);
  assert.ok(position > previous, `Header order: ${header}`);
  previous = position;
}
assert.match(html, /Organizational Unit/);
assert.match(html, /No location/);
assert.match(html, /10 Nov 2026/);
assert.match(html, new RegExp(`href="/asset-workspace/assignments/${id}"`));
assert.match(html, /\/assignments\/[^/"]+\/transfer"/);
assert.match(html, /\/assignments\/[^/"]+\/return"/);
assert.doesNotMatch(html, /checkbox|Asset ID/);
assert.doesNotMatch(html, />Actions<\/th>/);
assert.match(html, /<button[^>]*aria-label="Actions for Test laptop"/);
assert.match(html, /Select a row for its actions/);
const damaged = render(AssignmentsTable, { rows: [{ ...row, asset: { ...row.asset, condition: "Damaged" } }] });
assert.match(damaged, /Return it instead/);
assert.doesNotMatch(damaged, /\/assignments\/[^/"]+\/transfer"/);
assert.match(damaged, /aria-disabled="true"/);
const maintenance = render(AssignmentsTable, { rows: [{ ...row, asset: { ...row.asset, lifecycleStatus: "In Maintenance" } }] });
assert.doesNotMatch(maintenance, /\/assignments\/[^/"]+\/(transfer|return)"/);
assert.match(maintenance, /View Asset/);
const loading = render(AssignmentsTableLoading);
for (const header of headers) assert.ok(loading.includes(`>${header}</th>`));
assert.equal((loading.match(/<tr>/g) ?? []).length, 6);
assert.match(loading, /role="status"/);
assert.match(loading, /aria-hidden="true"/);
const tabs = render(AssignmentsTabs, { url: { get: () => "history", set() {} } });
assert.match(tabs, /role="tablist"/);
assert.match(tabs, /id="assignments-tab-history"[^>]*aria-selected="true"[^>]*tabindex="0"/);
assert.match(tabs, /id="assignments-tab-current"[^>]*aria-selected="false"[^>]*tabindex="-1"/);
assert.match(tabs, /aria-controls="assignments-panel"/);
console.log("Assignment table/menu/loading render checks passed");
