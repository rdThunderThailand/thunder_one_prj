import { SparklesIcon } from "@/components/ui/icons";

export function WorkspacesHeader() {
  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
        Workspaces
        <SparklesIcon className="h-5 w-5 text-primary" />
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Open specialized workspaces to create, manage, and operate with full capability.
      </p>
    </div>
  );
}
