// Stand-in for an Asset Workspace screen that is not built yet. The route, nav link and Help
// screenKey already exist (docs/adr/0097); the owner replaces this page with the real screen.
import { EmptyState } from "./states/states";

export function ScreenPlaceholder({ title, spec }: { title: string; spec: string }) {
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold text-foreground">
        {title}
      </h1>
      <EmptyState
        title="Not built yet"
        body={`This screen follows ${spec}.`}
      />
    </div>
  );
}
