import assert from "node:assert";
import { resumePromptKind } from "./resume-prompt.ts";

// Nothing was in storage — a fresh wizard must stay quiet.
assert.strictEqual(
  resumePromptKind({ hadContentAtHydration: false, hadEditingIdAtHydration: false, isUrlEditMode: false, dismissed: false }),
  null
);

// Leftover draft content from a previous visit, no editingId — prompt to resume the draft.
assert.strictEqual(
  resumePromptKind({ hadContentAtHydration: true, hadEditingIdAtHydration: false, isUrlEditMode: false, dismissed: false }),
  "draft"
);

// editingId was set at hydration (no content flag matters) — prompt to resume editing.
assert.strictEqual(
  resumePromptKind({ hadContentAtHydration: false, hadEditingIdAtHydration: true, isUrlEditMode: false, dismissed: false }),
  "editing"
);

// Opened as ?id=<uuid>: the wizard is deliberately loading a specific playlist, so there
// is nothing to ask about — even if content and editingId were present.
assert.strictEqual(
  resumePromptKind({ hadContentAtHydration: true, hadEditingIdAtHydration: true, isUrlEditMode: true, dismissed: false }),
  null
);

// Already answered once — do not nag for the rest of the session.
assert.strictEqual(
  resumePromptKind({ hadContentAtHydration: true, hadEditingIdAtHydration: true, isUrlEditMode: false, dismissed: true }),
  null
);

// editingId AND content both present — "editing" wins because the editingId check comes first.
assert.strictEqual(
  resumePromptKind({ hadContentAtHydration: true, hadEditingIdAtHydration: true, isUrlEditMode: false, dismissed: false }),
  "editing"
);

console.log("resume-prompt.check.mts OK");
