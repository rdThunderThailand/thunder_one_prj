// node release-filter.check.mts
import assert from "node:assert/strict";
import { DEFAULT_STATUSES, filterReleases, releaseStatus } from "./release-filter.ts";

const releases = [
  { display_name: "Ads V.1.0.4", version: "1.0.4", admitted: { status: "ready" as const } },
  { display_name: "Ads V.1.0.3", version: "1.0.3", admitted: null },
  { display_name: "zz-phase2-e2e 9.1.1", version: "9.1.1", admitted: { status: "revoked" as const } },
  { display_name: "zz-phase2-e2e 9.1.0", version: "9.1.0", admitted: { status: "revoked" as const } },
];

assert.deepEqual(releases.map(releaseStatus), ["approved", "not_approved", "withdrawn", "withdrawn"]);

// default hides Withdrawn and counts them
const byDefault = filterReleases(releases, "", DEFAULT_STATUSES);
assert.deepEqual(byDefault.shown.map((release) => release.version), ["1.0.4", "1.0.3"]);
assert.equal(byDefault.hiddenWithdrawn, 2);

// search by name (case-insensitive) or version; the hidden count follows the search
assert.deepEqual(filterReleases(releases, "ADS", DEFAULT_STATUSES).shown.length, 2);
assert.deepEqual(filterReleases(releases, "9.1.1", DEFAULT_STATUSES), { shown: [], hiddenWithdrawn: 1 });

// showing Withdrawn hides nothing
assert.deepEqual(filterReleases(releases, "", ["withdrawn"]), { shown: releases.slice(2), hiddenWithdrawn: 0 });
console.log("release-filter ok");
