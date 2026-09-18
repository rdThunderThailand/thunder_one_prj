import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ClassifiedError } from "@/lib/api/api-error";

export function EditorSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        {[280, 360, 240].map((height) => (
          <Card key={height} className="p-5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-3 h-5 w-60" />
            <Skeleton className="mt-5 w-full" />
            <div style={{ height }} />
          </Card>
        ))}
      </div>
      <Card className="h-96 p-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-12 w-full" />
      </Card>
    </div>
  );
}

export function EditorLoadError({
  error,
  retrying,
  onRetry,
}: {
  error: ClassifiedError;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <Card className="border-danger/30 p-8 text-center">
      <p className="text-sm font-semibold text-foreground">
        Channel editor is unavailable
      </p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-danger">
        {error.message}
      </p>
      <Button variant="secondary" className="mt-4" disabled={retrying} onClick={onRetry}>
        {retrying ? "Retrying…" : "Retry"}
      </Button>
    </Card>
  );
}
