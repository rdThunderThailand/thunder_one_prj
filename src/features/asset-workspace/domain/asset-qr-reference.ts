const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const qrPath = new RegExp(`^/(${UUID})/assets/(${UUID})$`, "i");

/** This narrow route also bounds the login return path; never follow a supplied origin. */
export function readAssetQrPath(path: string) {
  const match = qrPath.exec(path);
  return match && match[0] === path ? { tenantId: match[1].toLowerCase(), assetId: match[2].toLowerCase() } : null;
}

export function readAssetQrValue(value: string) {
  if (/[\u0000-\u0020\u007f]/.test(value)) return null;
  // Check the raw path before URL would normalize dot segments or encoded aliases.
  const match = /^https?:\/\/[^/?#\\]+(\/[^?#]*)$/i.exec(value);
  if (!match) return null;
  const reference = readAssetQrPath(match[1]);
  if (!reference) return null;
  try {
    const url = new URL(value);
    const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if ((url.protocol !== "https:" && !localHttp) || url.username || url.password) return null;
    return reference;
  } catch { return null; }
}

export function assetQrProfilePath(tenantId: string, assetId: string, selectedTenantId: string) {
  const reference = readAssetQrPath(`/${tenantId}/assets/${assetId}`);
  return reference?.tenantId === selectedTenantId.toLowerCase()
    ? `/asset-workspace/assets/${reference.assetId}` : null;
}
