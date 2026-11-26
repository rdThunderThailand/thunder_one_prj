/** Run: node src/features/asset-workspace/domain/registration-uploads.check.mts */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

type Next = (specifier: string, context: { parentURL?: string }) => unknown;
const { registerHooks } = createRequire(import.meta.url)("node:module");
const tick = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const ids = new Map<string, string>();
const log: string[] = [];
let sending = 0;
let most = 0;
let broken = "";
class RequestError extends Error {
  code: string;
  constructor(message: string, code: string) { super(message); this.code = code; }
}
const fake = {
  RegistrationRequestError: RequestError,
  reserveRegistrationUpload: async (_context: string, input: { upload_id: string; filename: string }) => {
    log.push(`reserve ${input.filename}`);
    await tick(5);
    const fileId = ids.get(input.upload_id) ?? crypto.randomUUID();
    ids.set(input.upload_id, fileId);
    return { uploadId: input.upload_id, fileId, completed: false, expiresAt: null, signedUploadUrl: "https://storage.example.test/staging" };
  },
  putRegistrationUpload: async (file: File) => {
    log.push(`put ${file.name}`);
    most = Math.max(most, ++sending);
    await tick(30);
    sending--;
    if (file.name === broken) throw new TypeError("Failed to fetch");
    return { ok: true, status: 200 };
  },
  completeRegistrationUpload: async (_context: string, uploadId: string) => {
    log.push("complete");
    return { fileId: ids.get(uploadId)!, expiresAt: new Date(Date.now() + 3600000).toISOString() };
  },
};
Object.assign(globalThis, { registrationUploadFake: fake });
// The network modules are replaced; the upload order, receipts and retry are the real code.
registerHooks({
  resolve(specifier: string, context: { parentURL?: string }, next: Next) {
    if (specifier === "./asset-registration-client" || specifier === "./registration-upload-transport") {
      return { url: `data:text/javascript,export const { ${Object.keys(fake).join(", ")} } = globalThis.registrationUploadFake;`, shortCircuit: true };
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:") && !/\.m?ts$/.test(specifier)) {
      const url = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(url))) return next(url.href, context);
    }
    return next(specifier, context);
  },
});
const { uploadRegistrationFiles } = await import("../services/asset-registration-uploads.ts");

type Args = Parameters<typeof uploadRegistrationFiles>;
const names = ["1.png", "2.png", "3.png", "4.png", "5.png"];
const candidates: Args[2] = names.map((name) => ({ localId: crypto.randomUUID(), purpose: "asset_photo", file: new File([name], name, { type: "image/png" }) }));
const initial = { submissionId: crypto.randomUUID(), uploads: [], draft: { photoSelectionIds: candidates.map((item) => item.localId), documentSelectionIds: [], warranties: [] } } as unknown as Args[1];
const options = { photoUpload: { enabled: true }, uploadStorage: { uploadEnabled: true } } as unknown as Args[3];
let saved = initial;
let shown = 0;
const run = (record: Args[1], persist: Args[4] = (next) => { saved = next; }) => {
  log.length = 0;
  return uploadRegistrationFiles("context", record, candidates, options, persist, (_message, active) => { shown = Math.max(shown, active.length); });
};

// Photos are reserved in their order, at most three are sent together, and the list keeps its order.
const done = await run(initial);
assert.deepEqual(log.filter((line) => line.startsWith("reserve")), names.map((name) => `reserve ${name}`));
assert.equal(most, 3);
assert.ok(shown > 1);
assert.deepEqual(done.uploads.map((item) => [item.filename, item.completed]), names.map((name) => [name, true]));
assert.deepEqual(saved, done);

// One failed file: the running ones are kept, and Retry sends only what is missing.
broken = "2.png";
await assert.rejects(run(initial), (failure: unknown) => failure instanceof RequestError && failure.code === "UPLOAD_RETRY");
assert.equal(sending, 0);
const kept = saved.uploads.filter((item) => item.completed).map((item) => item.filename);
assert.ok(kept.includes("1.png") && !kept.includes("2.png"));
broken = "";
const retried = await run(saved);
assert.deepEqual(log.filter((line) => line.startsWith("put")).toSorted(), names.filter((name) => !kept.includes(name)).map((name) => `put ${name}`));
assert.ok(retried.uploads.every((item) => item.completed) && retried.uploads.length === names.length);

// When the tab storage stops working, nothing more is verified.
let writes = 0;
await assert.rejects(run(initial, () => { if (++writes > 3) throw new Error("Storage is unavailable."); }), /Storage is unavailable/);
assert.equal(log.filter((line) => line === "complete").length <= 1, true);
assert.equal(log.includes("reserve 5.png"), false);

console.log("registration-uploads checks passed");
