import assert from "node:assert/strict";
import { seededRead } from "./seeded-read.ts";

let browserReads = 0;
const browserRead = async () => { browserReads += 1; return { ok: true as const, data: "browser" }; };
const seed = (data: Promise<string | null>) => ({ key: "asset", at: Date.now(), data });

// The first read uses the server's data, also when React mounts twice. A later Reload must read the latest data.
const first = seed(Promise.resolve("server"));
const [one, two] = await Promise.all([seededRead(first, "asset", browserRead), seededRead(first, "asset", browserRead)]);
assert.deepEqual([one.data, two.data, browserReads], ["server", "server", 0]);
assert.equal((await seededRead(first, "asset", browserRead)).data, "browser");

// The data streamed by React: a `then` that returns nothing, and `catch` of Promise.
const streamed = Object.assign(Object.create(Promise.prototype), { then: (done: (data: string) => void) => { done("server"); } }) as Promise<string>;
assert.equal((await seededRead(seed(streamed), "asset", browserRead)).data, "server");

// Another asset or account, a failed server read, old data, or no data: the browser reads.
assert.equal((await seededRead(seed(Promise.resolve("server")), "other", browserRead)).data, "browser");
assert.equal((await seededRead(seed(Promise.resolve(null)), "asset", browserRead)).data, "browser");
assert.equal((await seededRead(seed(Promise.reject(new Error("stream closed"))), "asset", browserRead)).data, "browser");
assert.equal((await seededRead({ ...seed(Promise.resolve("server")), at: Date.now() - 60_000 }, "asset", browserRead)).data, "browser");
assert.equal((await seededRead(undefined, "asset", browserRead)).data, "browser");
console.log("seeded read: ok");
