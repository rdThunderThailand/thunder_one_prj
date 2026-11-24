"use client";

import { ErrorState } from "@/features/asset-workspace/components/states/ErrorState";

// `error` is never shown — ErrorState keeps fixed copy so raw errors stay off screen.
export default function AssetWorkspaceError({ unstable_retry }: { error: Error; unstable_retry: () => void }) {
  return (
    <div className="p-6">
      <ErrorState onRetry={unstable_retry} />
    </div>
  );
}
