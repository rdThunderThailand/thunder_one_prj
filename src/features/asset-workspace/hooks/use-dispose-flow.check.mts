import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import type { DisposeFlow } from "./use-dispose-flow.ts";
import type { LifecycleResult } from "../services/asset-assignments-write.ts";
import type { AssetDetail } from "../services/asset-profile-contract.ts";

const require = createRequire(import.meta.url);
const id = "10000000-0000-4000-8000-000000000001";
let asset = { id, updatedAt: "v1", lifecycleStatus: "Available", condition: "Fair", custody: null } as AssetDetail;
const state: unknown[] = [];
let cursor = 0;
let pending = false;
const pushes: string[] = [];
const toasts: string[] = [];
const calls: unknown[] = [];
const evidence = { fileIds: [] as string[], items: [], busy: false, failed: false };
let finish: (result: LifecycleResult) => void = () => {};
const exports: Record<string, unknown> = {};

const compiled = ts.transpileModule(readFileSync(new URL("./use-dispose-flow.ts", import.meta.url), "utf8"), {
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
  if (name === "next/navigation") return { useRouter: () => ({ push(url: string) { pushes.push(url); }, refresh() {} }) };
  if (name === "sonner") return { toast: { success(text: string) { toasts.push(text); } } };
  if (name === "./use-asset-profile") return {
    useProfileRead(key: string) {
      if (key.endsWith("assign-options")) return { result: { ok: true, data: {} }, pending: false };
      if (key.endsWith("dispose-files")) return { result: { ok: true, data: { photos: [] } }, pending: false };
      if (key.endsWith("dispose-recent")) return { result: { ok: true, data: { data: [], total: 0 } }, pending: false };
      return { result: { ok: true, data: asset }, pending, reload() { pending = true; } };
    },
  };
  if (name === "../services/asset-profile-api") return { getAssetDetail() {}, getAssetFiles() {} };
  if (name.endsWith("/use-assign-flow")) return { getAssignOptions() {} };
  if (name.endsWith("/use-assign-evidence")) return { useAssignEvidence: () => evidence };
  if (name.endsWith("/asset-assignments-write")) return {
    getRecentAssignments() {},
    postLifecycle(action: string, context: string, assetId: string, body: unknown) {
      calls.push({ action, context, assetId, body });
      return new Promise<LifecycleResult>((resolve) => { finish = resolve; });
    },
  };
  return require(`${name}.ts`);
} });

const runHook = exports.useDisposeFlow as (context: string, assetId: string, profile: string) => DisposeFlow;
function render() { cursor = 0; return runHook("ctx", id, "/asset-workspace/assets/x"); }

render().setMethod("Scrapped-Destroyed");
render().setReason(" Beyond repair ");
assert.equal(render().block, "Only Retired assets can be disposed.");
assert.equal(render().canNext, false, "only Retired can continue");
asset = { ...asset, lifecycleStatus: "Retired" };
assert.equal(render().canNext, true);
render().next();
assert.equal(render().step, 1);
render().edit();
assert.equal(render().step, 0, "Edit returns to Details");
assert.equal(render().draft.reason, " Beyond repair ", "Edit keeps values");
render().next();
render().next();
assert.equal(render().step, 2);
assert.equal(calls.length, 0, "Review and Next: Confirm send nothing");
assert.equal(render().canConfirm, false, "Confirm off until ticked");
await render().confirm();
assert.equal(calls.length, 0);
render().setChecked(true);

const first = render().confirm();
await render().confirm();
assert.equal(calls.length, 1, "one request only");
assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), {
  action: "dispose", context: "ctx", assetId: id,
  body: { expectedUpdatedAt: "v1", disposalMethod: "Scrapped-Destroyed", reason: "Beyond repair" },
});
finish({ ok: false, code: "STALE", uncertain: false });
await first;
assert.equal(render().checked, true, "checkbox stays ticked on failure");
assert.equal(render().canConfirm, false);
render().reload();
assert.equal(render().step, 0);
assert.equal(render().draft.method, "Scrapped-Destroyed", "STALE keeps inputs");
pending = false;
asset = { ...asset, updatedAt: "v2" };
render().next();
render().next();

const second = render().confirm();
finish({ ok: false, code: "CONNECTION_FAILED", uncertain: true });
await second;
await render().confirm();
assert.equal(calls.length, 2, "uncertain blocks resubmit until Reload");
render().reload();
pending = false;
render().next();
render().next();
const third = render().confirm();
finish({ ok: true, data: { ...asset, lifecycleStatus: "Disposed" }, historyId: id });
await third;
await render().confirm();
assert.equal(calls.length, 3, "no submit after success");
assert.deepEqual(pushes, ["/asset-workspace/assets/x?tab=overview"]);
assert.deepEqual(toasts, [`Asset disposed. Transaction ID ${id}.`]);
console.log("Dispose eligibility, Edit, checkbox, one-request, Reload and success checks passed");
