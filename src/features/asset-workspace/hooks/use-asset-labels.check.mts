import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import type { AssetLabelsFlow } from "./use-asset-labels.ts";

const require = createRequire(import.meta.url);
const state: unknown[] = [];
let cursor = 0;
let mounted = false;
const pdfCalls: { ids: string[]; format: string; serial: boolean }[] = [];
const label = { id: "a1", name: "Laptop", assetTag: "AST-1" };
const exports: Record<string, unknown> = {};

const compiled = ts.transpileModule(readFileSync(new URL("./use-asset-labels.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

vm.runInNewContext(compiled, { exports, AbortController, require: (name: string) => {
  if (name === "react") return {
    useState(initial: unknown) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === "function" ? (initial as () => unknown)() : initial;
      return [state[index], (value: unknown) => {
        state[index] = typeof value === "function" ? (value as (previous: unknown) => unknown)(state[index]) : value;
      }];
    },
    useRef(initial: unknown) {
      const index = cursor++;
      if (!(index in state)) state[index] = { current: initial };
      return state[index];
    },
    useLayoutEffect(effect: () => void) { if (!mounted) { mounted = true; effect(); } },
  };
  if (name === "sonner") return { toast: { info() {} } };
  if (name === "../domain/asset-labels") return {
    assertLabelFormat() {}, DEFAULT_LABEL_FORMAT: "both", DEFAULT_LABEL_FIELDS: { assetTag: true, name: true, serialNumber: false },
    labelFailure: (error: unknown) => error, labelScope: (scope: unknown) => scope,
  };
  if (name === "../services/asset-label-preparation") return { prepareAssetLabels: async () => [label] };
  if (name === "../services/asset-label-pdf") return {
    async createAssetLabelsPdf(pages: { id: string }[], format: string, fields: { serialNumber: boolean }) {
      pdfCalls.push({ ids: pages.map(({ id }) => id), format, serial: fields.serialNumber });
      return { blob: new Blob(["x"]), filename: "labels.pdf" };
    },
  };
  if (name === "../services/asset-import-template") return { downloadBlob() {} };
  if (name === "../services/asset-label-print") return { printAssetLabelsPdf() {} };
  return require(`${name}.ts`);
} });

const runHook = exports.useAssetLabels as (context: string, key: string) => AssetLabelsFlow;
const render = () => { cursor = 0; return runHook("ctx", "a1"); };
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

// Dialog path (unchanged): settings in preview, generate() with no copies → one page per asset.
render().open([{ id: "a1", name: "Laptop", assetTag: "AST-1", status: "Available" }], null);
await settle();
assert.equal(render().phase, "preview");
render().setField("serialNumber", true);
await render().generate();
assert.deepEqual(pdfCalls[0], { ids: ["a1"], format: "both", serial: true }, "default generate keeps one page per asset");
assert.equal(render().phase, "ready");
assert.equal(render().completed, 2);

// FE 06 page path: copies repeat each page; a settings change after a PDF drops it and returns to preview.
await render().generate(3);
assert.deepEqual(pdfCalls[1].ids, ["a1", "a1", "a1"], "copies repeat the label");
assert.equal(render().completed, 4);
render().setFormat("qr");
assert.equal(render().phase, "preview");
assert.equal(render().file, null, "format change drops the PDF");
assert.equal(render().format, "qr");
await render().generate(2);
render().setField("serialNumber", false);
assert.equal(render().phase, "preview");
assert.equal(render().file, null, "field change drops the PDF");
console.log("Label hook default, copies and settings-after-PDF checks passed");
