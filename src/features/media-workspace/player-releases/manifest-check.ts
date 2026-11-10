type Picked = { name: string; size: number };

const MANIFEST = "manifest.json";
const SIGNATURE = "manifest.sig";

/**
 * ADR 0028 §11 amendment 2 item 2: compare the picked files with manifest.json before uploading.
 * Returns the reason Upload is disabled, or null. The signature is Core's check at Approve, not this one.
 */
export function manifestProblem(manifestText: string | null, version: string, picked: Picked[]): string | null {
  if (manifestText === null) return "Add manifest.json and manifest.sig to the build files.";
  if (!picked.some((file) => file.name === SIGNATURE)) return "Add manifest.sig to the build files.";

  let manifest: unknown;
  try {
    manifest = JSON.parse(manifestText);
  } catch {
    return "manifest.json is not valid JSON.";
  }
  const { version: signedVersion, files } = (manifest ?? {}) as { version?: unknown; files?: unknown };
  if (typeof signedVersion !== "string" || !Array.isArray(files)) return "manifest.json has no version or file list.";
  if (signedVersion !== version) return `manifest.json is for version ${signedVersion}, not ${version}.`;

  const payload = picked.filter((file) => file.name !== MANIFEST && file.name !== SIGNATURE);
  for (const entry of files as { name?: unknown; size_bytes?: unknown }[]) {
    const file = payload.find((item) => item.name === entry.name);
    if (!file) return `${String(entry.name)} is in manifest.json but not selected.`;
    if (file.size !== entry.size_bytes) return `${file.name} is ${file.size} bytes; manifest.json says ${String(entry.size_bytes)}.`;
  }
  const extra = payload.find((file) => !files.some((entry: { name?: unknown }) => entry.name === file.name));
  return extra ? `${extra.name} is not in manifest.json.` : null;
}
