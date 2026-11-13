"use client";

import { Card } from "@/components/ui/Card";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/lovable/button";
import { Skeleton } from "@/components/ui/lovable/skeleton";
import { useAssetImportFlow } from "../../hooks/use-asset-import-flow";
import { requestErrorText } from "../../domain/asset-import-messages";
import { readImportStep, rememberImportStep } from "../../services/asset-import-session";
import {
  ImportApiError,
  type AssetImportContext,
} from "../../services/asset-import-api";
import { AccessDeniedState, EmptyState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { BulkImportHeader } from "./BulkImportHeader";
import { UploadStep } from "./steps/UploadStep";
import { MapValidateStep } from "./steps/MapValidateStep";
import { ReviewConfirmStep } from "./steps/ReviewConfirmStep";
import { CompleteStep } from "./steps/CompleteStep";

export function BulkImportPage(context: AssetImportContext) {
  return (
    <ImportWorkspace
      key={`${context.tenantId}:${context.userId}`}
      context={context}
    />
  );
}

const neverChanges = () => () => {};

function ImportWorkspace({
  context,
}: {
  context: AssetImportContext;
}) {
  const flow = useAssetImportFlow(context);
  const { routeBatch } = flow;
  // The server cannot see this tab's storage, so it renders no active step rather than a wrong one.
  const rememberedStep = useSyncExternalStore(
    neverChanges,
    () => (routeBatch ? readImportStep(routeBatch) : null),
    () => null,
  );
  const step = !flow.loading ? flow.step : routeBatch ? rememberedStep : flow.step;
  const loadedBatchId = flow.loading ? null : flow.batch?.id;
  useEffect(() => {
    if (loadedBatchId) rememberImportStep(loadedBatchId, flow.step);
  }, [loadedBatchId, flow.step]);
  const [footer, setFooter] = useState<HTMLElement | null>(null);
  const requestError =
    flow.error instanceof ImportApiError ? flow.error : null;
  const denied = requestError?.status === 403;
  const unavailable =
    !flow.batch && ((!flow.preview && flow.options?.ready === false) ||
    requestError?.code === "IMPORT_UNAVAILABLE" ||
    requestError?.code === "REGISTRATION_UPLOAD_UNAVAILABLE");
  const blocked =
    denied ||
    unavailable ||
    (Boolean(requestError) && !flow.batch && !flow.selectedFile);
  const ready = !flow.loading && Boolean(flow.options) && !blocked;
  const renderFooter = (content: ReactNode) =>
    footer ? createPortal(content, footer) : null;
  const back = (
    <Button variant="outline" size="sm" asChild>
      <Link href="/asset-workspace/assets/register">
        Back to Register Asset
      </Link>
    </Button>
  );

  let content: ReactNode;
  if (flow.loading) {
    content = <BulkImportLoading step={step} />;
  } else if (denied) {
    const message = !flow.batch
      ? "You do not have permission to import assets."
      : flow.step === 2
        ? "Only the person who started this import can confirm it."
        : "Only the person who started this import can continue it.";
    content = <AccessDeniedState body={message} action={back} />;
  } else if (unavailable) {
    content = (
      <EmptyState
        title="Bulk import is not available yet"
        body="Ask your administrator or try again later."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {back}
            {process.env.NODE_ENV === "development" && flow.options && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/asset-workspace/assets/import?preview=upload">
                  Preview Upload File
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={flow.reload}>
              Retry
            </Button>
          </div>
        }
      />
    );
  } else if (blocked || !flow.options) {
    content = (
      <ErrorState
        body={
          requestError
            ? requestErrorText(requestError.code, requestError.status)
            : undefined
        }
        onRetry={flow.reload}
      />
    );
  } else {
    switch (flow.step) {
      case 0:
        content = <UploadStep flow={flow} context={context} renderFooter={renderFooter} />;
        break;
      case 1:
        content = <MapValidateStep flow={flow} renderFooter={renderFooter} />;
        break;
      case 2:
        content = (
          <ReviewConfirmStep
            key={flow.batch?.id}
            flow={flow}
            renderFooter={renderFooter}
          />
        );
        break;
      case 3:
        content = (
          <CompleteStep
            key={flow.batch?.id}
            flow={flow}
            renderFooter={renderFooter}
          />
        );
        break;
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-4 text-sm">
      <div
        data-registration-scroll
        className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-1 pb-1"
      >
        <BulkImportHeader step={step} />
        {flow.preview && (
          <p
            id="bulk-upload-preview-notice"
            role="status"
            className="shrink-0 rounded-control bg-info-muted p-3 text-xs text-info"
          >
            Import preview. Your file stays in this browser. Backend validation and importing are disabled.
          </p>
        )}
        {flow.notice && (
          <p
            role="status"
            className="shrink-0 rounded-control bg-info-muted p-3 text-xs text-info"
          >
            {flow.notice}
          </p>
        )}
        {content}
      </div>
      <footer
        ref={setFooter}
        data-registration-footer
        className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-card py-2 sm:py-3"
      >
        {!ready && back}
      </footer>
    </div>
  );
}

function BulkImportLoading({ step }: { step: number | null }) {
  return (
    <div
      role="status"
      aria-label="Loading bulk import"
      className={cn("space-y-3", step !== 3 && "@container/upload")}
    >
      {step !== 0 && <Skeleton className="h-20 w-full motion-reduce:animate-none" />}
      {step === 3 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 motion-reduce:animate-none" />
          ))}
        </div>
      )}
      <div
        className={`grid gap-3 ${
          step === 3 ? "" : step === 0
            ? "@min-4xl/upload:grid-cols-[minmax(0,4fr)_minmax(0,3fr)]"
            : step === 1
              ? "@min-4xl/upload:grid-cols-[minmax(0,7fr)_minmax(0,6fr)]"
              : "items-start @min-5xl/upload:grid-cols-[minmax(0,1fr)_20rem]"
        }`}
      >
        <Card className="space-y-3 motion-reduce:transition-none p-4">
          <Skeleton className="h-4 w-1/3 motion-reduce:animate-none" />
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-9 motion-reduce:animate-none" />
          ))}
        </Card>
        {step !== 3 && (
          <Card className="space-y-3 motion-reduce:transition-none p-4">
            <Skeleton className="h-4 w-1/2 motion-reduce:animate-none" />
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton
                key={index}
                className="h-9 motion-reduce:animate-none"
              />
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
