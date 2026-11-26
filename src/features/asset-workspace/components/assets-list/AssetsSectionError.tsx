import { Button } from "@/components/ui/lovable/button";
import { RefreshIcon } from "@/components/ui/icons";

export function AssetsSectionError({ title, message, pending, retry }: { title: string; message: string; pending: boolean; retry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-error-muted p-3 text-xs text-foreground">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p>{message}</p>
      </div>
      <Button variant="outline" size="sm" disabled={pending} onClick={retry}>
        <RefreshIcon className="size-3" />
        {pending ? "Retrying…" : "Retry"}
      </Button>
    </div>
  );
}
