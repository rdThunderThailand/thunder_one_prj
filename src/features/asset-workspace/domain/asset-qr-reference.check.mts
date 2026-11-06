/** Run: node src/features/asset-workspace/domain/asset-qr-reference.check.mts */
import assert from "node:assert/strict";
import { assetQrProfilePath, readAssetQrPath, readAssetQrValue } from "./asset-qr-reference.ts";

const tenant = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const asset = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const path = `/${tenant}/assets/${asset}`;
assert.deepEqual(readAssetQrPath(path.toUpperCase().replace("/ASSETS/", "/assets/")), { tenantId: tenant, assetId: asset });
assert.equal(assetQrProfilePath(tenant, asset, tenant.toUpperCase()), `/asset-workspace/assets/${asset}`);
assert.equal(assetQrProfilePath(tenant, asset, asset), null);
assert.deepEqual(readAssetQrValue(`https://app.example${path}`), { tenantId: tenant, assetId: asset });
assert.ok(readAssetQrValue(`http://localhost:3000${path}`));
for (const value of [
  `http://app.example${path}`, `https://user:pass@app.example${path}`, `https://app.example${path}?next=/other`,
  `https://app.example${path}#other`, `https://app.example/x/..${path}`, `https://app.example${path}/`,
  `javascript:alert(1)`, `https://app.example/${tenant}/assets/not-a-uuid`,
  `https://app.example${path}\n`, `https://app.exa\nmple${path}`,
]) assert.equal(readAssetQrValue(value), null, value);
for (const value of ["/media-workspace/assets/123", "/asset-workspace/assets/register", "/api/core/v2/assets", "/login", path + "/extra", path + "\n", `//evil.example${path}`]) {
  assert.equal(readAssetQrPath(value), null, value);
}
console.log("QR paths: UUIDs, same-organization profile target, URL safety, local origin and existing static-route exclusions passed.");
