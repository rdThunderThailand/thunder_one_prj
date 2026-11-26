import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { cloneElement, createElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Render the actual batch components; adapters replace only shared UI/Next boundaries and the separately tested hook.
// These assertions cover composition/default compatibility, not live scroll or focus behavior.
const require = createRequire(import.meta.url);
type Props = Record<string, unknown> & { children?: ReactNode };
type Component = (props: Props) => ReactElement;
const group: Component = ({ children }) => createElement("div", null, children);
const icon: Component = () => createElement("span", { "aria-hidden": true });
const button: Component = ({ asChild, children, ...props }) => {
  delete props.variant; delete props.size;
  return asChild ? cloneElement(children as ReactElement<Props>, props) : createElement("button", props, children);
};
const state: Component = ({ title, body, action }) => createElement("div", null, title as string, body as string, action as ReactNode);
const asset = { id: "10000000-0000-4000-8000-000000000001", name: "Laptop", assetTag: "AST-1", categoryPath: [], lifecycleStatus: "Assigned",
  condition: "Good", location: null, locationPath: [], category: null, serialNumber: null,
  custody: { id: "holder", type: "person", name: "Owner", avatarUrl: null, department: null } };
const no = () => {};
const initial = {
  asset, photo: null, step: 0, name: "Return Details", steps: ["Return Details", "Review", "Confirm"],
  detail: { result: { ok: true, data: asset }, pending: false, reload: no },
  options: { result: { ok: true, data: {} }, reload: no },
  recent: { result: { ok: true, data: { total: 0, data: [] } }, reload: no },
  condition: "Good", reason: "", evidence: { items: [], fileIds: [], busy: false, failed: false },
  save: { phase: "idle" }, saved: null, canNext: true, canConfirm: false,
  setReason: no, setCondition: no, reload: no, next: no, back: no, confirm: no,
};
let flow: object = initial;
const modules = new Map<string, Record<string, unknown>>();
function load(name: string): Record<string, unknown> {
  if (modules.has(name)) return modules.get(name)!;
  const exports: Record<string, unknown> = {};
  modules.set(name, exports);
  const compiled = ts.transpileModule(readFileSync(new URL(name, import.meta.url), "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(compiled, { exports, require: (id: string) => {
    if (id === "next/link") return { default: (props: Props) => createElement("a", props, props.children) };
    if (id.endsWith("/use-return-flow") || id === "./use-return-flow") return { useReturnFlow: () => flow };
    if (id.endsWith("/Card")) return { Card: (props: Props) => createElement("section", { ...props, "data-card": "card" }, props.children) };
    if (id.endsWith("/Skeleton")) return { Skeleton: (props: Props) => createElement("span", props) };
    if (id.endsWith("/PageHeader")) return { PageHeader: ({ title, subtitle }: Props) => createElement("header", null, title as string, subtitle as string) };
    if (id.endsWith("/Avatar")) return { Avatar: icon };
    if (id.endsWith("/Badge")) return { Badge: group };
    if (id.endsWith("/AssetThumbnail")) return { AssetThumbnail: icon };
    if (id.endsWith("/icons")) return new Proxy({}, { get: () => icon });
    if (id.endsWith("/button")) return { Button: button };
    if (id.endsWith("/textarea")) return { Textarea: (props: Props) => createElement("textarea", { ...props, readOnly: true }) };
    if (id.endsWith("/select")) return { Select: group, SelectContent: group, SelectTrigger: group, SelectItem: group, SelectValue: group };
    if (id.endsWith("/StatusBadges")) return {
      ConditionBadge: ({ condition }: Props) => createElement("span", null, condition as string),
      StatusBadge: ({ status }: Props) => createElement("span", null, status as string),
    };
    if (id.endsWith("/states/states")) return { AccessDeniedState: state, EmptyState: state, NotFoundState: state };
    if (id.endsWith("/states/ErrorState")) return { ErrorState: state };
    if (id === "./AssignAttachments") return { AssignAttachments: () => createElement("div", null, "Attachments (optional)") };
    if (id.startsWith("../../domain/")) return require(fileURLToPath(new URL(`${id}.ts`, import.meta.url)));
    if (id.startsWith("./")) return load(`${id}${existsSync(new URL(`${id}.tsx`, import.meta.url)) ? ".tsx" : ".ts"}`);
    return require(id);
  } });
  return exports;
}
const render = (entry: unknown, props = {}) => renderToStaticMarkup(createElement(entry as Component, props));
const { AssignSidePanel } = load("./AssignSidePanel.tsx");
const panelProps = { title: "Summary", asset, thumbnailUrl: null,
  from: { holder: null, empty: "None" }, to: { holder: null, empty: "Unassigned" }, outcomes: [], recent: null };
assert.match(render(AssignSidePanel, panelProps), /To \(New\)/);
assert.match(render(AssignSidePanel, { ...panelProps, toLabel: "To (Return)" }), /To \(Return\)/);
const { AssignLoadingMain, AssignFlowLoading } = load("./AssignFlowLoading.tsx");
assert.equal(render(AssignLoadingMain), render(AssignLoadingMain, { kind: "assign" }));
for (const kind of ["return", "transfer"]) assert.equal((render(AssignLoadingMain, { kind }).match(/data-card="card"/g) ?? []).length, 4);
assert.match(render(AssignLoadingMain, { kind: "return" }), /aria-label="Loading asset…"/);
const routeLoading = render(AssignFlowLoading, { kind: "return", title: "Return Asset", steps: ["Return Details", "Review", "Confirm"] });
assert.match(routeLoading, /data-assign-footer/);
assert.match(routeLoading, /assign-flow:overflow-y-auto/);
assert.doesNotMatch(render(AssignFlowLoading), /data-assign-footer/);
const { ReturnFlowView } = load("./ReturnFlowView.tsx");
const page = () => render(ReturnFlowView, { context: "ctx", assetId: asset.id, from: "assignments" });
const details = page();
assert.match(details, /Return Summary/);
assert.match(details, /To \(Return\)/);
assert.match(details, /Unassigned/);
assert.match(details, /Condition Check/);
assert.doesNotMatch(details, /Return Date|Return Location|Condition Notes|Accessories/);
flow = { ...initial, step: 1, name: "Review", canConfirm: true };
assert.match(page(), /Confirm Return/);
const review = page();
assert.match(review, /Review &amp; Confirm/);
assert.match(review, /2\. From \(Current\)[\s\S]*3\. To \(Return\)[\s\S]*4\. Return Details[\s\S]*5\. Condition Check[\s\S]*6\. Attachments/);
assert.match(review, /What will happen after confirmation\?/);
assert.match(review, />Back<[\s\S]*>Cancel<[\s\S]*Confirm Return/);
flow = { ...initial, options: { result: { ok: false, code: "INTERNAL" }, reload: no } };
assert.match(page(), /upload settings could not be loaded/);
assert.doesNotMatch(page(), /Confirm Return/);
flow = { ...initial, detail: { result: { ok: false, code: "NOT_FOUND" }, reload: no } };
assert.match(page(), /Asset not found/);
flow = { ...initial, detail: { result: { ok: false, code: "PERMISSION_DENIED" }, reload: no } };
assert.match(page(), /permission to return assets/);
flow = { ...initial, detail: { result: { ok: true, data: { ...asset, custody: null } } } };
assert.match(page(), /current custodian can be returned/);
flow = { ...initial, saved: { before: asset, after: { ...asset, custody: null, lifecycleStatus: "Available" } }, step: 2,
  evidence: { ...initial.evidence, items: [{ file: { name: "proof.pdf" } }] } };
assert.match(page(), /Asset returned/);
assert.match(page(), /proof.pdf/);
assert.doesNotMatch(page(), /Confirm Return/);
console.log("Return view, state, loading label/card and FE 02/03 default-prop compatibility checks passed");
