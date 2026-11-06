"use client";

import { useId, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/lovable/button";
import {
  ArrowRightIcon,
  BookIcon,
  DownloadIcon,
  SpinnerIcon,
} from "@/components/ui/icons";
import type { AssetImportFlow } from "../../../hooks/use-asset-import-flow";
import { useAssetImportTemplate } from "../../../hooks/use-asset-import-template";
import type { AssetImportContext } from "../../../services/asset-import-api";
import { BulkImportFileDropzone } from "../BulkImportFileDropzone";
import { BulkImportUploadedFile } from "../BulkImportUploadedFile";
import { BulkImportTemplatePreview } from "../BulkImportTemplatePreview";

export function UploadStep({
  flow,
  context,
  renderFooter,
}: {
  flow: AssetImportFlow;
  context: AssetImportContext;
  renderFooter: (content: ReactNode) => ReactNode;
}) {
  const router = useRouter();
  const fileFeedbackId = useId();
  const options = flow.options;
  const template = useAssetImportTemplate(options, context);
  if (!options) return null;
  const locked = flow.busy || flow.parsing;
  const file = flow.selectedFile ?? flow.parsed?.file;

  function selectFiles(files: File[]) {
    if (locked || !files?.length) return;
    if (files.length > 1) {
      toast.info("Only one file can be imported at a time.");
    }
    void flow.selectFile(files[0]);
  }

  return (
    <div className="@container/upload min-w-0 shrink-0">
      <div className={cn(
        "grid items-start gap-3 @min-4xl/upload:grid-cols-[minmax(0,4fr)_minmax(0,3fr)]",
        file && "@min-4xl/upload:items-stretch",
      )}>
        <div className="min-w-0 space-y-3">
          <section className="@container/choose-file space-y-3 rounded-card border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">1. Choose File</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Upload an Excel or CSV UTF-8 file with your asset information, or download
              the template to get started.
            </p>
            <BulkImportFileDropzone
              disabled={locked}
              maxBytes={options.file.maxBytes}
              maxRows={options.file.maxRows}
              feedbackId={file ? fileFeedbackId : undefined}
              onFiles={selectFiles}
            />
            <div className="flex items-center gap-3 text-2xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>or</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-2 @min-sm/choose-file:grid-cols-2">
              <Button
                variant="outline"
                className="h-auto min-h-12 justify-start gap-3 p-3"
                onClick={() => void template.downloadTemplate()}
                disabled={locked || template.downloading}
                aria-busy={template.downloading}
              >
                {template.downloading ? (
                  <SpinnerIcon aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin text-primary motion-reduce:animate-none" />
                ) : (
                  <DownloadIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                )}
                <span className="min-w-0 whitespace-normal text-start">
                  <span className="block text-xs font-semibold text-accent-foreground">
                    {template.downloading ? "Preparing template…" : "Download Template"}
                  </span>
                  <span className="block text-2xs text-muted-foreground">
                    Get the Excel template for bulk registration
                  </span>
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto min-h-12 justify-start gap-3 p-3"
                disabled
              >
                <BookIcon className="h-5 w-5 shrink-0 text-primary" />
                <span className="min-w-0 whitespace-normal text-start">
                  <span className="block text-xs font-semibold text-primary">
                    View Import Guide
                  </span>
                  <span className="block text-2xs text-muted-foreground">
                    Step-by-step instructions
                  </span>
                </span>
              </Button>
            </div>
          </section>
          <BulkImportUploadedFile
            key={`${file?.name ?? ""}:${file?.lastModified ?? ""}:${flow.parsed?.name ?? "reading"}`}
            flow={flow}
            fileFeedbackId={fileFeedbackId}
          />
        </div>
        <BulkImportTemplatePreview options={options} />
      </div>
      {renderFooter(
        <>
          <Button
            variant="outline"
            size="sm"
            className="min-w-20 max-sm:h-10"
            disabled={locked}
            onClick={async () => {
              if (await flow.clearFile()) {
                router.push("/asset-workspace/assets/register");
              }
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="min-w-24 max-sm:h-10"
            disabled={!flow.parsed || locked}
            aria-describedby={flow.preview ? "bulk-upload-preview-notice" : undefined}
            onClick={() => void flow.startBatch()}
          >
            <span>{flow.busy ? "Please wait…" : "Next"}</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </>,
      )}
    </div>
  );
}
