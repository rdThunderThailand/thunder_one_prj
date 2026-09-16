import assert from "node:assert/strict";
import { commitHistory, initHistory, redoHistory, undoHistory } from "./use-undoable-state.ts";

let h = initHistory({ n: 0 });
assert.deepEqual(h, { past: [], present: { n: 0 }, future: [] });

// commit is a no-op when the value is identical (Object.is).
const same = h.present;
assert.equal(commitHistory(h, same), h);

h = commitHistory(h, { n: 1 });
h = commitHistory(h, { n: 2 });
assert.equal(h.present.n, 2);
assert.equal(h.past.length, 2);

// undo walks back and fills future.
h = undoHistory(h);
assert.equal(h.present.n, 1);
assert.equal(h.future.length, 1);

// redo walks forward again.
h = redoHistory(h);
assert.equal(h.present.n, 2);
assert.equal(h.future.length, 0);

// a fresh commit after undo clears the redo branch.
h = undoHistory(h);
h = commitHistory(h, { n: 9 });
assert.equal(h.present.n, 9);
assert.equal(h.future.length, 0);

// undo/redo at the ends are no-ops.
const base = initHistory(0);
assert.equal(undoHistory(base).present, 0);
assert.equal(redoHistory(base).present, 0);

console.log("use-undoable-state.check.mts OK");
