import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import type { ChangeStatusFlow } from "./use-change-status-flow.ts";
import { postLifecycle, type LifecycleResult } from "../services/asset-assignments-write.ts";
import type { AssetDetail } from "../services/asset-profile-contract.ts";

const require = createRequire(import.meta.url);
const id = "10000000-0000-4000-8000-000000000001";
let asset = { id, updatedAt: "v1", lifecycleStatus: "Assigned", condition: "Good", custody: null } as AssetDetail;
const state: unknown[] = [];
let cursor = 0;
let pending = false;
let clock = 0;
class FakeDate extends Date { static now() { return clock; } }
let refreshes = 0;
const calls: unknown[] = [];
const evidence = { fileIds: [id], items: [], busy: false, failed: false };
let finish: (result: LifecycleResult) => void = () => {};
const exports: Record<string, unknown> = {};

const compiled = ts.transpileModule(readFileSync(new URL("./use-change-status-flow.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

vm.runInNewContext(compiled, { exports, AbortController, Date: FakeDate, require: (name: string) => {
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
      if (key.endsWith("change-status-files")) return { result: { ok: true, data: { photos: [] } }, pending: false };
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

const runHook = exports.useChangeStatusFlow as (context: string, assetId: string) => ChangeStatusFlow;
function render() { cursor = 0; return runHook("ctx", id); }

let flow = render();
assert.equal(flow.draft.status, "Assigned");
assert.equal(flow.draft.condition, "Good");
assert.equal(flow.canNext, false);
flow.chooseStatus("In Maintenance");
flow = render();
assert.equal(flow.draft.condition, "");
flow.setCondition("Fair");
flow.setReason("  Repair  ");
flow.setNotes("  Documented  ");
evidence.busy = true;
assert.equal(render().canNext, false);
evidence.busy = false;
evidence.failed = true;
assert.equal(render().canNext, false);
evidence.failed = false;
render().next();
clock += 1000;
flow = render();
assert.equal(flow.step, 1);
assert.equal(calls.length, 0, "Review sends nothing");
clock -= 1000;
await flow.confirm();
assert.equal(calls.length, 0, "Confirm right after Next (a double-click) sends nothing");
clock += 1000;

const first = flow.confirm();
await flow.confirm();
assert.equal(calls.length, 1);
assert.equal(render().save.phase, "sending");
assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), {
  action: "change-status", context: "ctx", assetId: id, body: {
    expectedUpdatedAt: "v1", status: "In Maintenance", condition: "Fair", reason: "Repair", notes: "Documented", evidenceFileIds: [id],
  },
});
finish({ ok: false, code: "STALE", uncertain: false });
await first;
flow = render();
assert.equal(flow.canConfirm, false);
flow.reload();
assert.equal(render().step, 0);
assert.equal(render().draft.reason, "  Repair  ");
assert.equal(render().draft.notes, "  Documented  ");
assert.equal(render().canNext, false);
pending = false;
asset = { ...asset, updatedAt: "v2" };
render().next();
clock += 1000;

const second = render().confirm();
finish({ ok: false, code: "CONNECTION_FAILED", uncertain: true });
await second;
await render().confirm();
assert.equal(calls.length, 2);
render().reload();
pending = false;
render().next();
clock += 1000;
flow = render();
const third = flow.confirm();
finish({ ok: true, data: { ...asset, lifecycleStatus: "In Maintenance", condition: "Fair" }, historyId: id });
await third;
await flow.confirm();
assert.equal(calls.length, 3, "a retained event cannot submit after success");
assert.equal((calls[2] as { body: { expectedUpdatedAt: string } }).body.expectedUpdatedAt, "v2");
assert.equal(render().step, 2);
assert.equal(render().saved?.historyId, id);
assert.equal(render().saved?.before.lifecycleStatus, "Assigned");
assert.equal(render().saved?.after.lifecycleStatus, "In Maintenance");
assert.equal(refreshes, 1);
console.log("Change Status flow, duplicate-submit, Reload and result checks passed");

const signal = new AbortController().signal;
const savedAsset = {
  ...asset, name: "Laptop", assetTag: "AST-1", serialNumber: null, category: null, categoryPath: [], qrValue: null,
  location: null, acquisitionDate: null, registrationDate: "2026-11-10", lifecycleStatus: "In Maintenance", condition: "Fair",
};
const payload = { expectedUpdatedAt: "v2", status: "In Maintenance", condition: "Fair", reason: "Repair" };
let transportCalls = 0;
const response = await postLifecycle("change-status", "ctx", id, payload, signal, async (...args) => {
  transportCalls += 1;
  assert.deepEqual(args, ["POST", `/${id}/change-status`, payload, { context: "ctx", signal, creation: true }]);
  return { asset: savedAsset, historyId: id };
});
assert.equal(transportCalls, 1);
assert.equal(response.ok && response.historyId, id);
assert.equal(response.ok && response.data.lifecycleStatus, "In Maintenance");
assert.deepEqual(await postLifecycle("change-status", "ctx", id, payload, signal, async () => ({
  asset: { ...savedAsset, id: "another-asset" }, historyId: id,
})), { ok: false, code: "INVALID_RESPONSE", uncertain: true });
console.log("Lifecycle transport and response checks passed");
