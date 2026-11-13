import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { Children, createElement, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
type Props = Record<string, unknown> & { children?: ReactNode };
type Handler = (...args: unknown[]) => unknown;
const asset = { id: "asset", lifecycleStatus: "Available", location: { id: "from", name: "Current Room" }, locationPath: [], updatedAt: "old-version" };
let latest = asset;
const destination = { id: "to", name: "Repair Bench" };
let optionsResult: unknown = { ok: true, data: { referenceSelectors: {} } };
let result: unknown = { ok: true, data: { asset, rules: {} } };
let moveResult: unknown = { ok: false, code: "STALE", uncertain: false };
let active = true;
let index = 0;
let hooks: unknown[] = [];
let pending = false;
let reloads = 0;
let observed: unknown;
let closed: unknown;
let loadForm: ((signal: AbortSignal) => Promise<unknown>) | undefined;
const calls: unknown[] = [];
const lookups: unknown[] = [];
const surface = ({ children }: Props) => createElement("div", null, children);
const button = ({ children, disabled, type }: Props) =>
  createElement("button", { type: type as "button" | "submit", disabled: Boolean(disabled) }, children);
const dialogContent = ({ children }: Props) => createElement("div", { role: "dialog" }, children);
const picker = ({ kind, value, error }: Props) =>
  createElement("div", { "data-picker": kind as string, "data-value": value as string }, error as ReactNode);
const mocks: Record<string, unknown> = {
  react: {
    useState(initial: unknown) {
      const slot = index++;
      if (!(slot in hooks)) hooks[slot] = initial;
      return [hooks[slot], (next: unknown) => { hooks[slot] = next; }];
    },
    useRef(initial: unknown) {
      const slot = index++;
      if (!(slot in hooks)) hooks[slot] = { current: initial };
      return hooks[slot];
    },
  },
  sonner: { toast: { success() {} } },
  "@/components/ui/Badge": { Badge: surface },
  "@/components/ui/Skeleton": { Skeleton: () => null },
  "@/components/ui/lovable/button": { Button: button },
  "@/components/ui/lovable/dialog": {
    Dialog: surface, DialogContent: dialogContent, DialogHeader: surface, DialogTitle: surface, DialogDescription: surface,
  },
  "@/components/ui/lovable/textarea": { Textarea: ({ value }: Props) => createElement("textarea", { defaultValue: value as string }) },
  "../../hooks/use-asset-profile": { useProfileRead: (_key: string, loader: typeof loadForm) => {
    loadForm = loader;
    return { result, pending, reload: () => { reloads++; pending = true; } };
  } },
  "../../services/asset-assignments-write": { moveAssetLocation: async (context: string, id: string, body: unknown) => {
    calls.push({ context, id, body });
    return moveResult;
  } },
  "../../services/asset-profile-api": { getAssetDetail: async () => ({ ok: true, data: latest }) },
  "../../services/registration-selector-client": { fetchRegistrationReferences: async (_context: string, query: unknown) => {
    lookups.push(query);
    return { items: active ? [destination] : [] };
  } },
  "../../services/registration-selector-contract": { referenceLabel: (value: { name: string }) => value.name },
  "../register-asset/RegistrationTreeField": { RegistrationTreeField: picker },
  "./use-assign-flow": { getAssignOptions: async () => optionsResult },
};
const url = new URL("./MoveLocationFlow.tsx", import.meta.url);
const exports: { MoveLocationFlow?: (props: Props) => ReactNode } = {};
vm.runInNewContext(ts.transpileModule(readFileSync(url, "utf8"), { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText, {
  exports, AbortController, requestAnimationFrame: () => 0,
  require: (id: string) => mocks[id] ?? (id.startsWith("../../domain/")
    ? require(fileURLToPath(new URL(`${id}.ts`, url))) : require(id)),
});
const draw = () => {
  index = 0;
  return exports.MoveLocationFlow!({
    context: "tenant:user", assetId: "asset", onSaved: (next: unknown) => { observed = next; },
    onClose: (refresh: unknown) => { closed = refresh; }, restoreFocus() {},
  });
};
function find(node: ReactNode, predicate: (props: Props) => boolean): Props | undefined {
  if (!isValidElement<Props>(node)) return undefined;
  if (predicate(node.props)) return node.props;
  for (const child of Children.toArray(node.props.children)) {
    const match = find(child, predicate);
    if (match) return match;
  }
}
const props = (tree: ReactNode, predicate: (props: Props) => boolean) => {
  const found = find(tree, predicate);
  assert.ok(found);
  return found;
};
const fire = (value: unknown, ...args: unknown[]) => (value as Handler)(...args);
const html = (tree: ReactNode) => renderToStaticMarkup(tree);
const submit = (tree: ReactNode) => fire(props(tree, (node) => typeof node.onSubmit === "function").onSubmit, { preventDefault() {} });
const moveDisabled = (tree: ReactNode) => props(tree, (node) => node.type === "submit").disabled;
const plain = (value: unknown) => JSON.parse(JSON.stringify(value));
const load = () => loadForm!(new AbortController().signal);

let tree = draw();
assert.match(html(tree), /Move Location.*Needs attention.*mock-up.*Reason \/ Note \(optional\)/);
assert.equal(moveDisabled(tree), true);
fire(props(tree, (node) => node.kind === "locations").onChange, { id: "from", name: "Current Room" });
tree = draw();
assert.match(html(tree), /Choose a different location/);
assert.equal(moveDisabled(tree), true);
fire(props(tree, (node) => node.kind === "locations").onChange, destination);
fire(props(tree, (node) => node.id === "move-location-reason").onChange, { target: { value: "  Bench check  " } });
tree = draw();
assert.equal(moveDisabled(tree), false);
assert.match(html(tree), /Step 1 of 2.*Next/);
await submit(tree);
assert.equal(calls.length, 0);
tree = draw();
assert.match(html(tree), /Step 2 of 2.*Review move.*Current Room.*Repair Bench.*No current custodian \(unchanged\).*Bench check.*Back.*Move/);
fire(props(tree, (node) => node.children === "Back").onClick);
tree = draw();
assert.equal(props(tree, (node) => node.kind === "locations").value, "to");
await submit(tree);
tree = draw();

const inflight = submit(tree);
const duplicate = submit(tree);
let prevented = false;
fire(props(tree, (node) => typeof node.onEscapeKeyDown === "function").onEscapeKeyDown, { preventDefault() { prevented = true; } });
assert.equal(prevented, true);
await inflight;
await duplicate;
assert.equal(calls.length, 1);
assert.deepEqual(plain(calls[0]), { context: "tenant:user", id: "asset", body: {
  expectedUpdatedAt: "old-version", locationId: "to", reason: "Bench check",
} });
tree = draw();
assert.match(html(tree), /This asset was changed by someone else/);
assert.equal(moveDisabled(tree), true);
assert.match(html(tree), /Review move.*Repair Bench.*Bench check/);
fire(props(tree, (node) => node.children === "Reload").onClick);
tree = draw();
assert.equal(reloads, 1);
assert.match(html(tree), /Loading asset and locations…/);
assert.equal(calls.length, 1);

latest = { ...asset, updatedAt: "fresh-version" };
active = false;
result = await load();
pending = false;
tree = draw();
assert.deepEqual(plain(lookups), [{ kind: "locations", id: "to" }]);
assert.match(html(tree), /Choose an active location/);
assert.equal(moveDisabled(tree), true);
active = true;
fire(props(tree, (node) => node.kind === "locations").onChange, destination);
tree = draw();
assert.equal(moveDisabled(tree), false);
assert.match(html(tree), /Step 1 of 2/);
await submit(tree);
tree = draw();
assert.match(html(tree), /Step 2 of 2/);
moveResult = { ok: false, code: "VALIDATION", uncertain: false };
await submit(tree);
tree = draw();
assert.match(html(tree), /Some details were rejected\. Check the destination and reason\./);
assert.match(html(tree), /Review move/);
assert.deepEqual(plain(calls[1]), { context: "tenant:user", id: "asset", body: {
  expectedUpdatedAt: "fresh-version", locationId: "to", reason: "Bench check",
} });
moveResult = { ok: true, data: latest };
await submit(tree);
assert.equal(observed, latest);
fire(props(tree, (node) => node.children === "Back").onClick);
tree = draw();
fire(props(tree, (node) => node.children === "Cancel").onClick);
assert.equal(closed, true);

hooks = [];
result = { ok: false, code: "PERMISSION_DENIED" };
assert.match(html(draw()), /You don&#x27;t have permission to move this asset/);
optionsResult = { ok: false, code: "UNREACHABLE" };
result = await load();
assert.match(html(draw()), /Couldn&#x27;t load the asset or locations/);
result = { ok: true, data: { asset: { ...asset, lifecycleStatus: "Retired" }, rules: {} } };
assert.match(html(draw()), /This asset can&#x27;t be moved/);
assert.equal(moveDisabled(draw()), true);
console.log("Move Location dialog two steps, guards, preserved draft, active reload, fresh version, validation and success passed");
