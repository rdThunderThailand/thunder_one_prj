import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import type { RetireFlow } from "./use-retire-flow.ts";
import type { LifecycleResult } from "../services/asset-assignments-write.ts";
import type { AssetDetail } from "../services/asset-profile-contract.ts";

const require = createRequire(import.meta.url);
const id = "10000000-0000-4000-8000-000000000001";
let asset = { id, updatedAt: "v1", lifecycleStatus: "Assigned", condition: "Good", custody: { name: "Holder" } } as AssetDetail;
const state: unknown[] = [];
let cursor = 0;
let pending = false;
let refreshes = 0;
const calls: unknown[] = [];
const evidence = { fileIds: [] as string[], items: [], busy: false, failed: false };
let finish: (result: LifecycleResult) => void = () => {};
const exports: Record<string, unknown> = {};

const compiled = ts.transpileModule(readFileSync(new URL("./use-retire-flow.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

vm.runInNewContext(compiled, { exports, AbortController, require: (name: string) => {
  if (name === "react") return {
    useState(initial: unknown) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], (value: unknown) => { state[index] = value; }];
    },
    useRef(initial: unknown) {
      const index = cursor++;
      if (!(index in state)) state[index] = { current: initial };
      return state[index];
    },
  };
  if (name === "next/navigation") return { useRouter: () => ({ refresh() { refreshes += 1; } }) };
  if (name === "./use-asset-profile") return {
    useProfileRead(key: string) {
      if (key.endsWith("assign-options")) return { result: { ok: true, data: {} }, pending: false };
      if (key.endsWith("retire-files")) return { result: { ok: true, data: { photos: [] } }, pending: false };
      return { result: { ok: true, data: asset }, pending, reload() { pending = true; } };
    },
  };
  if (name === "../services/asset-profile-api") return { getAssetDetail() {}, getAssetFiles() {} };
  if (name.endsWith("/use-assign-flow")) return { getAssignOptions() {} };
  if (name.endsWith("/use-assign-evidence")) return { useAssignEvidence: () => evidence };
  if (name.endsWith("/asset-assignments-write")) return {
    postLifecycle(action: string, context: string, assetId: string, body: unknown) {
      calls.push({ action, context, assetId, body });
      return new Promise<LifecycleResult>((resolve) => { finish = resolve; });
    },
  };
  return require(`${name}.ts`);
} });

const runHook = exports.useRetireFlow as (context: string, assetId: string) => RetireFlow;
function render() { cursor = 0; return runHook("ctx", id); }

let flow = render();
flow.setReason("End of life");
flow = render();
assert.deepEqual(flow.eligibility, { kind: "blocked", action: "return" });
assert.equal(flow.canNext, false, "Assigned keeps Next off");
asset = { ...asset, lifecycleStatus: "In Maintenance" };
assert.deepEqual(render().eligibility, { kind: "blocked", action: "change-status" });
assert.equal(render().canNext, false, "In Maintenance with a holder keeps Next off");
asset = { ...asset, lifecycleStatus: "Available", custody: null };
flow = render();
assert.equal(flow.draft.condition, "Good", "condition defaults to the current one");
assert.equal(flow.canNext, true);
evidence.busy = true;
assert.equal(render().canNext, false);
evidence.busy = false;
render().setCondition("Unusable");
render().setNotes("  Wiped  ");
render().next();
flow = render();
assert.equal(flow.step, 1);
assert.equal(calls.length, 0, "Review sends nothing");

const first = flow.confirm();
await flow.confirm();
assert.equal(calls.length, 1, "second click blocked while sending");
assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), {
  action: "retire", context: "ctx", assetId: id,
  body: { expectedUpdatedAt: "v1", condition: "Unusable", reason: "End of life", notes: "Wiped" },
});
finish({ ok: false, code: "STALE", uncertain: false });
await first;
assert.equal(render().canConfirm, false);
render().reload();
assert.equal(render().step, 0);
assert.equal(render().draft.condition, "Unusable");
assert.equal(render().draft.notes, "  Wiped  ");
pending = false;
asset = { ...asset, updatedAt: "v2" };
render().next();

const second = render().confirm();
finish({ ok: false, code: "CONNECTION_FAILED", uncertain: true });
await second;
await render().confirm();
assert.equal(calls.length, 2, "uncertain blocks resubmit until Reload");
render().reload();
pending = false;
render().next();
flow = render();
const third = flow.confirm();
finish({ ok: true, data: { ...asset, lifecycleStatus: "Retired", condition: "Unusable" }, historyId: id });
await third;
await flow.confirm();
assert.equal(calls.length, 3, "no submit after success");
assert.equal((calls[2] as { body: { expectedUpdatedAt: string } }).body.expectedUpdatedAt, "v2");
assert.equal(render().step, 2);
assert.equal(render().saved?.historyId, id);
assert.equal(render().saved?.after.lifecycleStatus, "Retired");
assert.equal(refreshes, 1);
console.log("Retire eligibility, duplicate-submit, Reload and result checks passed");
