import { Button } from "@/components/ui/lovable/button";
import type { useRegistrationFileCache } from "../../hooks/use-registration-file-cache";

type FileCache = ReturnType<typeof useRegistrationFileCache>;
export function RegistrationFileStorageState({ cache }: { cache: FileCache }) {
  if (cache.error || cache.cleanupError) {
    return (
      <div role="alert" className="space-y-2 rounded-control bg-warning-muted p-3 text-xs text-foreground">
        {cache.error && <p>{cache.error}</p>}
        {cache.cleanupError && <p>{cache.cleanupError}</p>}
        <Button variant="outline" size="sm" disabled={cache.restoring || cache.saving} onClick={cache.retry}>
          {cache.restoring || cache.saving ? "Please wait…" : cache.cleanupError ? "Retry file cleanup" : "Retry file recovery"}
        </Button>
      </div>
    );
  }
  return cache.hasFiles ? (
    <p role="status" className="min-h-4 text-xs text-muted-foreground">
      {cache.restoring ? "Restoring selected files…" : cache.saving ? "Saving selected files in this browser…" : ""}
    </p>
  ) : null;
}
