import assert from "node:assert";
import { shouldShowResumePrompt } from "./resume-prompt.ts";

// Nothing was in storage — a fresh wizard must stay quiet, and typing cannot change that
// because current content is not an input to this decision at all. This is the reported bug.
assert.strictEqual(
  shouldShowResumePrompt({ hadContentAtHydration: false, isEditMode: false, dismissed: false }),
  false
);

// Leftover work from a previous visit — ask before overwriting or resuming it.
assert.strictEqual(
  shouldShowResumePrompt({ hadContentAtHydration: true, isEditMode: false, dismissed: false }),
  true
);

// Opened as ?id=<uuid>: the wizard is deliberately loading a specific playlist, so there is
// nothing to ask about.
assert.strictEqual(
  shouldShowResumePrompt({ hadContentAtHydration: true, isEditMode: true, dismissed: false }),
  false
);

// Already answered once — do not nag for the rest of the session.
assert.strictEqual(
  shouldShowResumePrompt({ hadContentAtHydration: true, isEditMode: false, dismissed: true }),
  false
);

console.log("resume-prompt.check.mts OK");
