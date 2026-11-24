// node feed-check.check.mts
import assert from "node:assert/strict";
import { feedProblem } from "./feed-check.ts";

// The real 1.0.4 feed from develop.
const feed = '{"Assets":[{"PackageId":"SignagePlayer","Version":"1.0.4","Type":"Full","FileName":"SignagePlayer-1.0.4-windows-x64-full.nupkg","SHA1":"F8EAC0BDC350DFB58C37AA1BDD763ED513532C05","SHA256":"FA21F2C87DC0431845921496DF4EE58A3E717F7AAC6E64E616D822CAAC7060EB","Size":50141229}]}';
const picked = [
  { name: "SignagePlayer-1.0.4-windows-x64-full.nupkg", size: 50141229 },
  { name: "releases.windows-x64.json", size: 272 },
];
const withAsset = (change: Record<string, unknown>) => JSON.stringify({ Assets: [{ ...JSON.parse(feed).Assets[0], ...change }] });

assert.equal(feedProblem(feed, "1.0.4", picked), null);
assert.equal(feedProblem("﻿" + feed, "1.0.4", picked), null);
assert.match(feedProblem(feed, "1.0.4", [...picked, { name: "manifest.sig", size: 88 }]) ?? "", /Upload only the two files from vpk pack/);
assert.match(feedProblem(feed, "1.0.4", [...picked, { name: "extra.exe", size: 1 }]) ?? "", /extra\.exe is not a build file/);
// typed 1.0.6, picked the 1.0.4 build
assert.match(feedProblem(feed, "1.0.6", picked) ?? "", /not a build file for version 1\.0\.6/);
assert.match(feedProblem(feed, "1.0.4", picked.slice(1)) ?? "", /Add SignagePlayer-1\.0\.4/);
assert.match(feedProblem(null, "1.0.4", picked.slice(0, 1)) ?? "", /Add releases\.windows-x64\.json/);
assert.match(feedProblem("{", "1.0.4", picked) ?? "", /not valid JSON/);
assert.match(feedProblem("{}", "1.0.4", picked) ?? "", /exactly one package/);
assert.match(feedProblem(JSON.stringify({ Assets: [{}, {}] }), "1.0.4", picked) ?? "", /exactly one package/);
assert.match(feedProblem(withAsset({ Type: "Delta" }), "1.0.4", picked) ?? "", /Delta package/);
assert.match(feedProblem(withAsset({ Version: "1.0.5" }), "1.0.4", picked) ?? "", /for version 1\.0\.5, not 1\.0\.4/);
assert.match(feedProblem(withAsset({ FileName: "other.nupkg" }), "1.0.4", picked) ?? "", /lists other\.nupkg/);
assert.match(feedProblem(feed, "1.0.4", [{ ...picked[0], size: 1 }, picked[1]]) ?? "", /is 1 bytes; .* says 50141229/);
console.log("feed-check ok");
