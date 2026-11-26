import { AssetProfileLoading } from "@/features/asset-workspace/components/asset-profile/AssetProfileLoading";

// Opened from Assignments, the profile starts on its Assignments tab (owner 2026-11-11), so load that layout.
export default function Loading() {
  return <AssetProfileLoading tab="assignments" />;
}
