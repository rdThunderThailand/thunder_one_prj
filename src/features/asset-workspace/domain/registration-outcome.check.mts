/** Run: node src/features/asset-workspace/domain/registration-outcome.check.mts */
import assert from "node:assert/strict";
import { registrationOutcome, registrationProgress } from "./registration-outcome.ts";

const base = { uncertain: false, message: "Service message." };

// An uncertain create only offers the safe retry, whatever the code says.
assert.deepEqual(
  [registrationOutcome({ ...base, uncertain: true, code: "SERIAL_DUPLICATE", status: 409 }, true).primary,
    registrationOutcome({ ...base, uncertain: true, code: "SERIAL_DUPLICATE", status: 409 }, true).title],
  ["retry", "We couldn't confirm the result"],
);

// Duplicate serial lists Core's details and offers the override only when it is available.
const duplicate = registrationOutcome({
  ...base, code: "SERIAL_DUPLICATE", status: 409,
  details: [{ id: "a", assetTag: "AST-000001", name: "Laptop" }, { id: "b", assetTag: null, name: "Old" }, { bad: true }],
}, true);
assert.equal(duplicate.primary, "override");
assert.equal(duplicate.secondary, "edit");
assert.deepEqual(duplicate.duplicates, [{ id: "a", assetTag: "AST-000001", name: "Laptop" }, { id: "b", assetTag: null, name: "Old" }]);
assert.equal(registrationOutcome({ ...base, code: "SERIAL_DUPLICATE", status: 409 }, false).primary, "edit");
assert.deepEqual(registrationOutcome({ ...base, code: "SERIAL_DUPLICATE", status: 409, details: "nope" }, true).duplicates, []);

// Files, availability, access, conflicts, validation and connection.
assert.equal(registrationOutcome({ ...base, code: "UPLOAD_EXPIRED", status: 409 }, true).primary, "edit");
assert.equal(registrationOutcome({ ...base, code: "UPLOAD_RETRY", status: 503 }, true).primary, "retry");
assert.deepEqual(
  [registrationOutcome({ ...base, code: "REGISTRATION_UNAVAILABLE", status: 503 }, true).tone,
    registrationOutcome({ ...base, code: "REGISTRATION_UNAVAILABLE", status: 503 }, true).primary],
  ["info", "close"],
);
assert.equal(registrationOutcome({ ...base, code: "PERMISSION_DENIED", status: 403 }, true).title, "Your access changed");
assert.equal(registrationOutcome({ ...base, code: "INVALID_STATE", status: 409 }, true).primary, "edit");
assert.equal(registrationOutcome({ ...base, code: "VALIDATION", status: 400 }, true).title, "Some information was rejected");
assert.equal(registrationOutcome({ ...base, code: "CONNECTION_FAILED" }, true).primary, "retry");
assert.equal(registrationOutcome({ ...base, code: "INTERNAL", status: 500 }, true).primary, "retry");
// Local checks (no code) keep their own message.
const local = registrationOutcome({ ...base, message: "Check the highlighted registration step before confirming." }, true);
assert.deepEqual([local.title, local.body, local.primary], ["Check your registration", "Check the highlighted registration step before confirming.", "edit"]);

// Progress moves forward through the stages.
assert.equal(registrationProgress("checking", 0, 0), 8);
assert.equal(registrationProgress("uploading", 0, 2), 15);
assert.equal(registrationProgress("uploading", 1, 2), 48);
assert.equal(registrationProgress("uploading", 2, 2), 80);
assert.equal(registrationProgress("uploading", 0, 0), 80);
assert.equal(registrationProgress("creating", 0, 0), 90);

console.log("registration-outcome checks passed");
