"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/lovable/button";
import { ChevronRightIcon, DownloadIcon, PrintIcon } from "@/components/ui/icons";
import { LABEL_SUBTITLE, LABEL_TITLE } from "../../domain/asset-lifecycle-actions";
import { profileHref } from "../../domain/assignment-assign";
import { useAssetLabels, type AssetLabelsFlow } from "../../hooks/use-asset-labels";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { getAssetDetail, getAssetFiles } from "../../services/asset-profile-api";
import type { AssetDetail } from "../../services/asset-profile-contract";
import type { LabelPreviewStatus } from "../asset-labels/AssetLabelPreview";
import { AssetLabelsProgress } from "../asset-labels/AssetLabelsProgress";
import { ActionLayout, AssignFlowTitle } from "../assignments/AssignFlowHeader";
import { AssignFlowWorkspace } from "../assignments/AssignFlowWorkspace";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import {
  ChangeStatusFieldsLoading, ChangeStatusFooterLoading, ChangeStatusRailLoading, changeStatusBodyClass,
  changeStatusFooterColumns, changeStatusFooterFrame, changeStatusFooterSurface,
} from "./ChangeStatusLoading";
import { LabelPreviewCard, LabelSettingsCard, LabelSummary } from "./LabelPanels";

type LabelAction = "download" | "print";
const denied = (code?: string) => code === "PERMISSION_DENIED" || code === "UNAUTHENTICATED";

function LabelError({ labels }: { labels: AssetLabelsFlow }) {
  if (!labels.error) return null;
  const retryable = labels.phase === "error" && (labels.error.status === 0 || labels.error.status >= 500);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-error/20 bg-error-muted p-3">
      <p role="alert" className="text-xs">{labels.error.message}</p>
      {labels.error.status === 401 && (
        <Button asChild size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
      )}
      {retryable && <Button type="button" variant="outline" size="sm" onClick={labels.retry}>Retry</Button>}
    </div>
  );
}

export function LabelFlowView({ context, assetId, from }: { context: string; assetId: string; from?: string }) {
  const fromAssignments = from === "assignments";
  const href = profileHref(assetId, fromAssignments);
  const listHref = fromAssignments ? "/asset-workspace/assignments" : "/asset-workspace/assets";
  const detail = useProfileRead(`${context}:${assetId}:label-detail`, (signal) => getAssetDetail(context, assetId, signal));
  const files = useProfileRead(`${context}:${assetId}:label-files`, (signal) => getAssetFiles(context, assetId, signal));
  const labels = useAssetLabels(context, `label-page:${assetId}`);
  const [copies, setCopies] = useState(1);
  const [preview, setPreview] = useState<LabelPreviewStatus>("loading");
  const madeWith = useRef<number | null>(null);
  const pending = useRef<LabelAction | null>(null);
  const asset = detail.result?.ok ? detail.result.data : null;
  const disposed = asset?.lifecycleStatus === "Disposed";
  const photoFile = files.result?.ok ? files.result.data.photos[0] : undefined;
  const photo = photoFile?.thumbnailUrl ?? photoFile?.url ?? null;
  const generating = labels.phase === "generating";
  const showForm = Boolean(asset && !disposed);
  const canRun = (labels.phase === "preview" || labels.phase === "ready") && preview === "ready"
    && labels.error?.code !== "INVALID_TAG";
  const name = asset ? `${asset.name} (${asset.assetTag})` : "Asset Profile";

  const start = useEffectEvent(() => {
    if (!asset) return;
    labels.open([{ id: asset.id, name: asset.name, assetTag: asset.assetTag, status: asset.lifecycleStatus, serialNumber: asset.serialNumber }], null);
  });
  useEffect(() => { if (asset?.id && !disposed) start(); }, [asset?.id, disposed]);

  // A PDF made for other copies is stale; settings changes already drop it in the hook.
  const finish = useEffectEvent(() => {
    const action = pending.current;
    pending.current = null;
    if (action && labels.phase === "ready") labels[action]();
  });
  useEffect(() => { if (labels.phase === "ready" || labels.phase === "preview") finish(); }, [labels.phase]);

  function run(action: LabelAction) {
    if (!canRun) return;
    if (labels.file && madeWith.current === copies) { labels[action](); return; }
    pending.current = action;
    madeWith.current = copies;
    void labels.generate(copies);
  }

  return (
    <AssignFlowWorkspace>
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link className="hover:underline" href={listHref}>{fromAssignments ? "Assignments" : "Assets"}</Link>
        <ChevronRightIcon aria-hidden="true" className="size-3 shrink-0" />
        <Link className="min-w-0 wrap-anywhere hover:underline" href={href}>{name}</Link>
        <ChevronRightIcon aria-hidden="true" className="size-3 shrink-0" />
        <span aria-current="page" className="font-semibold text-foreground">{LABEL_TITLE}</span>
      </nav>
      <div data-assign-body className={changeStatusBodyClass}>
        <ActionLayout
          head={(
            <div className="rounded-card border border-border bg-card p-4">
              <AssignFlowTitle origin={{ href, label: "Asset Profile" }} title={LABEL_TITLE} subtitle={LABEL_SUBTITLE} />
            </div>
          )}
          main={(
            <div aria-busy={!detail.result || labels.phase === "loading" || generating} className="min-w-0 space-y-3">
              <LabelContent detail={detail} disposed={disposed} href={href}>
                {labels.phase === "loading" && (
                  <AssetLabelsProgress completed={0} total={1} preparation={{ ...labels.preparation, preview: false }} />
                )}
                {(labels.phase === "preview" || labels.phase === "ready" || generating) && (
                  <>
                    <LabelPreviewCard flow={labels} onStatus={setPreview}>
                      {generating && <AssetLabelsProgress completed={labels.completed} total={labels.labels.length * copies} />}
                    </LabelPreviewCard>
                    <LabelSettingsCard flow={labels} copies={copies} onCopies={setCopies} disabled={generating} />
                  </>
                )}
                <LabelError labels={labels} />
              </LabelContent>
            </div>
          )}
          panel={asset && !disposed ? <LabelSummary asset={asset} photo={photo} files={files} /> : !detail.result ? <ChangeStatusRailLoading /> : undefined}
        />
      </div>
      {showForm ? (
        <footer className={`${changeStatusFooterFrame} ${changeStatusFooterColumns}`}>
          <div className={changeStatusFooterSurface}>
            <Button asChild variant="outline" size="sm" className="min-w-20 max-sm:h-10">
              <Link href={href}>Back</Link>
            </Button>
            <div className="ml-auto flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" size="sm" className="max-sm:h-10" disabled={!canRun} onClick={() => run("download")}>
                <DownloadIcon aria-hidden="true" className="size-4" />
                Download PDF
              </Button>
              <Button type="button" size="sm" className="min-w-28 max-sm:h-10" disabled={!canRun} onClick={() => run("print")}>
                <PrintIcon aria-hidden="true" className="size-4" />
                {generating ? "Generating…" : "Print Label"}
              </Button>
            </div>
          </div>
        </footer>
      ) : !detail.result ? <ChangeStatusFooterLoading /> : null}
    </AssignFlowWorkspace>
  );
}

function LabelContent({ detail, disposed, href, children }: {
  detail: ReturnType<typeof useProfileRead<AssetDetail>>;
  disposed: boolean; href: string; children: ReactNode;
}) {
  if (!detail.result) {
    return (
      <>
        <p role="status" className="sr-only">Loading asset…</p>
        <ChangeStatusFieldsLoading />
      </>
    );
  }
  if (!detail.result.ok) {
    if (detail.result.code === "NOT_FOUND") return <NotFoundState title="Asset not found" />;
    if (denied(detail.result.code)) return <AccessDeniedState />;
    return <ErrorState title="Couldn't load this asset" body="The asset could not be loaded. Check your connection and retry." onRetry={detail.reload} />;
  }
  if (disposed) {
    return (
      <EmptyState
        title="Disposed assets can't be labelled."
        body="Return to the asset profile to view its current details."
        action={<Button asChild variant="outline" size="sm"><Link href={href}>View Asset Profile</Link></Button>}
      />
    );
  }
  return children;
}
