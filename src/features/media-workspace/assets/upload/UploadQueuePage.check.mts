import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./UploadQueuePage.tsx", import.meta.url), "utf8");

assert.ok(source.includes("URL.createObjectURL(file)"), "queued files must get a local preview URL");
assert.ok(source.includes('alt=""'), "the decorative queue preview must have empty alt text");

console.log("upload queue preview: all checks passed");
