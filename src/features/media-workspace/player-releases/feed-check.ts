type Picked = { name: string; size: number };

const TRACK = "windows-x64";
const BOM = "﻿";

/**
 * ADR 0028 §4 amendment 4 items 1-2: compare the picked files with the vpk feed before uploading. Names, version and
 * sizes only; Core checks SHA-256 at Approve. Returns the reason Upload is disabled, or null.
 */
export function feedProblem(feedText: string | null, version: string, picked: Picked[]): string | null {
  if (picked.some((file) => file.name === "manifest.json" || file.name === "manifest.sig")) {
    return "Upload only the two files from vpk pack";
  }
  const pkgName = `SignagePlayer-${version}-${TRACK}-full.nupkg`;
  const feedName = `releases.${TRACK}.json`;
  const extra = picked.find((file) => file.name !== pkgName && file.name !== feedName);
  if (extra) return `${extra.name} is not a build file for version ${version}. Expected ${pkgName} and ${feedName}.`;
  const pkg = picked.find((file) => file.name === pkgName);
  if (!pkg) return `Add ${pkgName}.`;
  if (feedText === null) return `Add ${feedName}.`;

  let feed: unknown;
  try {
    feed = JSON.parse(feedText.startsWith(BOM) ? feedText.slice(1) : feedText);
  } catch {
    return `${feedName} is not valid JSON.`;
  }
  const assets = (feed as { Assets?: unknown } | null)?.Assets;
  if (!Array.isArray(assets) || assets.length !== 1) return `${feedName} must list exactly one package.`;
  const [asset] = assets as { Type?: unknown; Version?: unknown; FileName?: unknown; Size?: unknown }[];
  if (asset?.Type !== "Full") return `${feedName} lists a ${String(asset?.Type)} package; upload a Full build (--delta none).`;
  if (asset.Version !== version) return `${feedName} is for version ${String(asset.Version)}, not ${version}.`;
  if (asset.FileName !== pkg.name) return `${feedName} lists ${String(asset.FileName)}, not ${pkg.name}.`;
  if (asset.Size !== pkg.size) return `${pkg.name} is ${pkg.size} bytes; ${feedName} says ${String(asset.Size)}.`;
  return null;
}
