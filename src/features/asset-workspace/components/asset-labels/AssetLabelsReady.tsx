import { CheckIcon, FileTextIcon } from "@/components/ui/icons";
import { formatBytes } from "../../domain/asset-import-format";

export function AssetLabelsReady({ filename, size, count }: { filename: string; size: number; count: number }) {
  return (
    <div className="space-y-4 py-4 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-muted text-success">
        <CheckIcon aria-hidden="true" className="size-6" />
      </span>
      <p role="status" className="text-sm font-semibold">Your label file is ready to download or print.</p>
      <div className="flex items-center gap-3 rounded-control border border-border p-3 text-left">
        <FileTextIcon aria-hidden="true" className="size-6 shrink-0 text-primary" />
        <div className="min-w-0 space-y-1 text-xs">
          <p className="font-medium wrap-anywhere">{filename}</p>
          <p className="text-muted-foreground">PDF · {formatBytes(size)} · {count.toLocaleString("en-GB")} labels</p>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">Print at actual size (100%) on 50 × 30 mm label stock. Print opens the PDF in a new tab.</p>
    </div>
  );
}
