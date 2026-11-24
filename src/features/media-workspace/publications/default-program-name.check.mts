import assert from "node:assert/strict";
import { defaultProgramName } from "./default-program-name.ts";

assert.equal(defaultProgramName([]), undefined);
assert.equal(defaultProgramName([undefined]), undefined);
assert.equal(defaultProgramName(["Morning"]), "Morning");
assert.equal(defaultProgramName(["Morning", "Lunch", "Night"]), "Morning +2");
assert.equal(defaultProgramName(["  ", "Lunch"]), undefined);
console.log("default-program-name.check: ok");
