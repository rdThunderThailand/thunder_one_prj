/** Run: node src/config/tenant-access-rules.check.mts */
import assert from "node:assert/strict";
import { allowedAppIds, canOpenApp, deniedAppLanding, NO_APP_LANDING } from "./tenant-access-rules.ts";

const viewer = { isSuperAdmin: false, tenantAppRole: "viewer" };
const apps = [
  { id: "media-workspace", basePath: "/media-workspace" },
  { id: "asset-intelligence", basePath: "/asset-intelligence" },
  { id: "asset-workspace", basePath: "/asset-workspace" },
];

// Owner tenant, super admin and an unknown role see every App, whatever Core switched on.
assert.equal(allowedAppIds({ ...viewer, tenantAppRole: "owner", enabledWorkspaces: [] }), null);
assert.equal(allowedAppIds({ ...viewer, isSuperAdmin: true, enabledWorkspaces: [] }), null);
assert.equal(allowedAppIds({ ...viewer, tenantAppRole: null, enabledWorkspaces: [] }), null);

// Core without a catalog (or older Core): today's rule.
assert.deepEqual([...allowedAppIds({ ...viewer, enabledWorkspaces: null })!], ["media-workspace"]);

// Core's switches win once sent, including switching Media Workspace off.
assert.deepEqual([...allowedAppIds({ ...viewer, enabledWorkspaces: ["asset-workspace", "people"] })!], ["asset-workspace", "people"]);
assert.equal(allowedAppIds({ ...viewer, enabledWorkspaces: [] })!.size, 0);

const assetOnly = allowedAppIds({ ...viewer, enabledWorkspaces: ["asset-workspace"] });
assert.equal(canOpenApp(assetOnly, "media-workspace"), false);
assert.equal(canOpenApp(assetOnly, "asset-workspace"), true);
assert.equal(canOpenApp(null, "anything"), true);

// A denied App sends the user to the first App they may open, never back into a denied one.
assert.equal(deniedAppLanding(assetOnly, apps), "/asset-workspace");
assert.equal(deniedAppLanding(new Set(["media-workspace"]), apps), "/media-workspace");
assert.equal(deniedAppLanding(new Set(), apps), NO_APP_LANDING);

console.log("tenant-access-rules checks passed");
