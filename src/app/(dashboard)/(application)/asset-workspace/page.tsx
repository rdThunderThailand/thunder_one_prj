// Overview — the shell only in Phase 1; summary counts arrive with the smoke
// slice (P1-09). docs/adr/0097.
export default function AssetWorkspaceOverviewPage() {
  return (
    <div className="space-y-1 p-6">
      <h1 className="text-xl font-semibold text-foreground">
        Overview
      </h1>
      <p className="text-sm text-muted-foreground">
        Asset Workspace is being built. Screens appear here as they are ready.
      </p>
    </div>
  );
}
