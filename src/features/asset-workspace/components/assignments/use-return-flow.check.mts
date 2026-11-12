import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import type { AssetDetail } from "../../services/asset-profile-contract.ts";
import type { AssignResult } from "../../services/asset-assignments-write.ts";
import type { ReturnFlow } from "./use-return-flow.ts";

// Exercise the actual hook's event handlers with deterministic read/state/transport adapters.
// No browser, effects, uploads or network; this does not prove live React scheduling or viewport fit.
const require = createRequire(import.meta.url);
const id = "10000000-0000-4000-8000-000000000001";
let asset = { id, name: "Laptop", assetTag: "AST-1", updatedAt: "v1", condition: "Good", lifecycleStatus: "Assigned",
  custody: { id, type: "person", name: "Owner" } } as AssetDetail;
let state: unknown[] = [];
let cursor = 0;
let pending = false;
let optionsOk = true;
let prefill = "Damaged";
let reloads = 0;
let refreshes = 0;
const calls: { body: unknown }[] = [];
let finish: (value: AssignResult) => void = () => {};
const evidence = { fileIds: [id], items: [], busy: false, failed: false };
const exports: Record<string, unknown> = {};
const compiled = ts.transpileModule(readFileSync(new URL("./use-return-flow.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
vm.runInNewContext(compiled, { exports, AbortController, require: (name: string) => {
  if (name === "react") return {
    useState: (initial: unknown) => {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial;
      return [state[index], (value: unknown) => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
    },
    useRef: (initial: unknown) => {
      const index = cursor++;
      if (!(index in state)) state[index] = { current: initial };
      return state[index];
    },
  };
  if (name === "next/navigation") return {
    useSearchParams: () => new URLSearchParams({ condition: prefill }), useRouter: () => ({ refresh: () => { refreshes += 1; } }),
  };
  if (name === "../../hooks/use-asset-profile") return { useProfileRead: (key: string) => {
    if (key.endsWith("assign-options")) return { result: optionsOk ? { ok: true, data: {} } : { ok: false, code: "INTERNAL" }, pending: false };
    if (key.endsWith("return-detail")) return { result: { ok: true, data: asset }, pending,
      reload: () => { reloads += 1; pending = true; } };
    return { result: { ok: true, data: { photos: [], data: [] } }, pending: false, reload() {} };
  } };
  if (name === "../../services/asset-profile-api") return { getAssetDetail() {}, getAssetFiles() {} };
  if (name === "../../services/asset-assignments-write") return { getRecentAssignments() {},
    returnAsset: (_context: string, _id: string, body: unknown) => {
      calls.push({ body });
      return new Promise<AssignResult>((resolve) => { finish = resolve; });
    },
  };
  if (name === "./use-assign-flow") return { getAssignOptions() {} };
  if (name === "./use-assign-evidence") return { useAssignEvidence: () => evidence };
  if (name.startsWith("../../domain/")) return require(fileURLToPath(new URL(`${name}.ts`, import.meta.url)));
  return require(name);
} });
const runHook = exports.useReturnFlow as (context: string, id: string) => ReturnFlow;
function render() { cursor = 0; return runHook("ctx", id); }
let flow = render();
assert.equal(flow.condition, "Damaged");
assert.equal(flow.canConfirm, false);
flow.setReason(" Keep input ");
flow.next();
flow = render();
assert.equal(flow.name, "Review");
const first = flow.confirm();
await flow.confirm();
assert.equal(calls.length, 1, "double click dispatches only one POST");
assert.equal(render().save.phase, "sending");
finish({ ok: false, code: "STALE", uncertain: false });
await first;
flow = render();
assert.equal(flow.reason, " Keep input ");
assert.equal(flow.condition, "Damaged");
assert.equal(flow.canConfirm, false);
await flow.confirm();
assert.equal(calls.length, 1, "STALE cannot silently obtain a new version and retry");
flow.reload();
flow = render();
assert.equal(reloads, 1);
assert.equal(flow.canConfirm, false, "reload in progress blocks save");
pending = false;
asset = { ...asset, updatedAt: "v2" };
flow = render();
assert.equal(flow.canConfirm, true);
const second = flow.confirm();
finish({ ok: false, code: "INTERNAL", uncertain: true });
await second;
flow = render();
assert.equal(flow.canConfirm, false);
await flow.confirm();
assert.equal(calls.length, 2, "uncertain failure is not retried");
flow.reload(); pending = false;
flow = render();
const third = flow.confirm();
const retainedConfirm = flow.confirm;
finish({ ok: true, data: { ...asset, custody: null, lifecycleStatus: "In Maintenance", condition: "Damaged" } });
await third;
await retainedConfirm();
assert.equal(calls.length, 3, "a retained handler cannot submit again after success");
flow = render();
assert.equal(flow.name, "Confirm");
assert.equal(flow.saved?.after.custody, null);
assert.equal(refreshes, 1, "success refreshes the route cache without retrying the write");
assert.equal(flow.canConfirm, false);
assert.equal(calls.at(-1)?.body && (calls.at(-1)!.body as { expectedUpdatedAt: string }).expectedUpdatedAt, "v2");
state = []; optionsOk = false;
assert.equal(render().canNext, false, "missing upload settings blocks the form");
state = []; optionsOk = true; prefill = "invalid"; asset = { ...asset, condition: "Fair" };
assert.equal(render().condition, "Fair");
state = []; asset = { ...asset, condition: null };
assert.equal(render().canNext, false);
state = []; asset = { ...asset, condition: "Good", lifecycleStatus: "Available", custody: null };
assert.equal(render().canNext, false);
console.log("Return hook duplicate-submit, stale/uncertain, reload preservation, prefill and result checks passed");
