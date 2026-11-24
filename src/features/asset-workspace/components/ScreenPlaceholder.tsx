// Stand-in for an Asset Workspace screen that is not built yet. The route, nav link and Help
// screenKey already exist (docs/adr/0097); the owner replaces this page with the real screen.
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "./states/states";

export function ScreenPlaceholder({ title, spec }: { title: string; spec: string }) {
  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title={title}
        subtitle={`Follows ${spec}`}
      />
      <EmptyState
        title="Not built yet"
        body="The owner in docs/asset-workspace/plan-mvp-delivery.md replaces this page."
      />
    </div>
  );
}
