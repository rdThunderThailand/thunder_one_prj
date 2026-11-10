// node manifest-check.check.mts
import assert from "node:assert/strict";
import { manifestProblem } from "./manifest-check.ts";

const manifest = JSON.stringify({ version: "1.0.3", files: [{ name: "app-1.0.3-full.nupkg", size_bytes: 10 }] });
const picked = [
  { name: "app-1.0.3-full.nupkg", size: 10 },
  { name: "manifest.json", size: 80 },
  { name: "manifest.sig", size: 88 },
];

assert.equal(manifestProblem(manifest, "1.0.3", picked), null);
// the Player team's 1.0.2 upload: manifest says 1.0.1
assert.match(manifestProblem(manifest, "1.0.2", picked) ?? "", /version 1\.0\.3, not 1\.0\.2/);
assert.match(manifestProblem(null, "1.0.3", picked.slice(0, 1)) ?? "", /Add manifest\.json/);
assert.match(manifestProblem(manifest, "1.0.3", picked.slice(0, 2)) ?? "", /manifest\.sig/);
assert.match(manifestProblem(manifest, "1.0.3", picked.slice(1)) ?? "", /not selected/);
assert.match(manifestProblem(manifest, "1.0.3", [{ ...picked[0], size: 11 }, ...picked.slice(1)]) ?? "", /11 bytes/);
assert.match(manifestProblem(manifest, "1.0.3", [...picked, { name: "extra.exe", size: 1 }]) ?? "", /extra\.exe is not in/);
assert.match(manifestProblem("{", "1.0.3", picked) ?? "", /not valid JSON/);
console.log("manifest-check ok");
