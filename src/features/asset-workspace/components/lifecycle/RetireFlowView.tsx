"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/lovable/button";
import { ArrowRightIcon, CheckIcon, ChevronRightIcon, DownloadIcon } from "@/components/ui/icons";
import { RETIRE_STEPS, RETIRE_SUBTITLE, RETIRE_TITLE } from "../../domain/asset-lifecycle-actions";
import { profileHref } from "../../domain/assignment-assign";
import { useAssetExport } from "../../hooks/use-asset-export";
import { useRetireFlow, type RetireFlow } from "../../hooks/use-retire-flow";
import { AssetsExportDialog } from "../assets-list/AssetsExportDialog";
import { ActionLayout, AssignFlowTitle } from "../assignments/AssignFlowHeader";
import { AssignFlowWorkspace } from "../assignments/AssignFlowWorkspace";
import { lifecycleWriteText } from "../assignments/assignment-error-text";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import {
  ChangeStatusFieldsLoading, ChangeStatusFooterLoading, ChangeStatusRailLoading, changeStatusBodyClass,
  changeStatusFooterColumns, changeStatusFooterFrame, changeStatusFooterSurface,
} from "./ChangeStatusLoading";
import { RetireDetails } from "./RetireDetails";
import { RetireResult } from "./RetireResult";
import { RetireReview } from "./RetireReview";
import { RetireSummary } from "./RetireSummary";

const denied = (code?: string) => code === "PERMISSION_DENIED" || code === "UNAUTHENTICATED";
const secondaryAction = "min-w-20 max-sm:h-10";

function RetireFooter({ flow, href, onExport }: { flow: RetireFlow; href: string; onExport: (trigger: HTMLButtonElement) => void }) {
  if (flow.saved) {
    return (
      <footer className={changeStatusFooterFrame}>
        <div className={changeStatusFooterSurface}>
          <Button type="button" variant="outline" size="sm" className={secondaryAction} onClick={(event) => onExport(event.currentTarget)}>
            <DownloadIcon aria-hidden="true" className="size-4" />
            Export Asset Record
          </Button>
          <div className="ml-auto flex flex-wrap justify-end gap-2">
            <Button asChild variant="outline" size="sm" className={secondaryAction}>
              <Link href="/asset-workspace/assets">Go to Assets</Link>
            </Button>
            <Button asChild size="sm" className="min-w-36 max-sm:h-10">
              <Link href={href}>
                View Asset Profile
                <ArrowRightIcon aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    );
  }
  const sending = flow.save.phase === "sending";
  const review = flow.step === 1;
  const cancel = sending ? (
    <Button variant="outline" size="sm" className={secondaryAction} disabled>Cancel</Button>
  ) : (
    <Button asChild variant="outline" size="sm" className={secondaryAction}>
      <Link href={href}>Cancel</Link>
    </Button>
  );
  return (
    <footer className={`${changeStatusFooterFrame} ${changeStatusFooterColumns}`}>
      <div className={changeStatusFooterSurface}>
        {review ? (
          <Button type="button" variant="outline" size="sm" className={secondaryAction} disabled={sending} onClick={flow.back}>Back</Button>
        ) : cancel}
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          {review && cancel}
          <Button
            type="button"
            size="sm"
            className={review ? "min-w-36 max-sm:h-10" : "min-w-28 max-sm:h-10"}
            disabled={review ? !flow.canConfirm : !flow.canNext}
            onClick={review ? flow.confirm : flow.next}
          >
            {review && !sending && <CheckIcon aria-hidden="true" className="size-4" />}
            {sending ? "Saving…" : review ? "Next: Confirm" : "Next"}
            {!sending && <ArrowRightIcon aria-hidden="true" className="size-4" />}
          </Button>
        </div>
      </div>
    </footer>
  );
}

export function RetireFlowView({ context, assetId, from }: { context: string; assetId: string; from?: string }) {
  const flow = useRetireFlow(context, assetId);
  const exportFlow = useAssetExport(context, assetId);
  const fromAssignments = from === "assignments";
  const href = profileHref(assetId, fromAssignments);
  const listHref = fromAssignments ? "/asset-workspace/assignments" : "/asset-workspace/assets";
  const name = flow.asset ? `${flow.asset.name} (${flow.asset.assetTag})` : "Asset Profile";
  const loaded = Boolean(flow.asset && flow.options.result?.ok);
  const waiting = !flow.saved && (!flow.detail.result || !flow.options.result);
  const showForm = loaded && flow.eligibility?.kind !== "done";
  const summary = flow.saved?.after ?? (showForm ? flow.asset : null);
  const body = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const lastStep = useRef(flow.step);
  const saving = flow.save.phase === "sending";
  const exportAsset = (trigger: HTMLButtonElement) => exportFlow.openSelected([assetId], trigger);

  useEffect(() => {
    if (lastStep.current === flow.step) return;
    lastStep.current = flow.step;
    body.current?.scrollTo({ top: 0 });
    stage.current?.focus({ preventScroll: true });
  }, [flow.step]);

  return (
    <AssignFlowWorkspace>
      <nav aria-label="Breadcrumb" inert={saving || undefined} className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link className="hover:underline" href={listHref}>{fromAssignments ? "Assignments" : "Assets"}</Link>
        <ChevronRightIcon aria-hidden="true" className="size-3 shrink-0" />
        <Link className="min-w-0 wrap-anywhere hover:underline" href={href}>{name}</Link>
        <ChevronRightIcon aria-hidden="true" className="size-3 shrink-0" />
        <span aria-current="page" className="font-semibold text-foreground">{RETIRE_TITLE}</span>
      </nav>
      <div ref={body} data-assign-body className={changeStatusBodyClass}>
        <ActionLayout
          head={(
            <div inert={saving || undefined} className="rounded-card border border-border bg-card p-4">
              <AssignFlowTitle
                origin={{ href, label: "Asset Profile" }}
                steps={RETIRE_STEPS}
                step={flow.step}
                title={RETIRE_TITLE}
                subtitle={flow.saved ? "The asset has been retired successfully." : RETIRE_SUBTITLE}
              />
            </div>
          )}
          main={(
            <div ref={stage} tabIndex={-1} aria-label={RETIRE_STEPS[flow.step]} aria-busy={saving || waiting} className="min-w-0 space-y-3 focus:outline-none">
              {flow.save.phase === "failed" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-error/20 bg-error-muted p-3">
                  <p role="alert" className="text-xs">{lifecycleWriteText(flow.save.code, flow.save.uncertain)}</p>
                  {flow.needsReload && <Button type="button" variant="outline" size="sm" onClick={flow.reload}>Reload</Button>}
                </div>
              )}
              <RetireContent flow={flow} href={href} fromAssignments={fromAssignments} />
            </div>
          )}
          panel={summary ? <RetireSummary asset={summary} flow={flow} href={href} onExport={exportAsset} />
            : waiting ? <ChangeStatusRailLoading /> : undefined}
        />
      </div>
      {flow.saved || showForm ? <RetireFooter flow={flow} href={href} onExport={exportAsset} /> : waiting ? <ChangeStatusFooterLoading /> : null}
      <AssetsExportDialog flow={exportFlow} />
    </AssignFlowWorkspace>
  );
}

function RetireContent({ flow, href, fromAssignments }: { flow: RetireFlow; href: string; fromAssignments: boolean }) {
  if (flow.saved) return <RetireResult saved={flow.saved} photo={flow.photo} />;
  const { detail, options, asset, eligibility } = flow;
  if (!detail.result || !options.result) {
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
  if (!options.result.ok) {
    if (denied(options.result.code)) return <AccessDeniedState />;
    return <ErrorState title="Couldn't load the form" body="The upload settings could not be loaded. Check your connection and retry." onRetry={options.reload} />;
  }
  if (!asset || eligibility?.kind === "done") {
    return (
      <EmptyState
        title={eligibility?.kind === "done" ? eligibility.message : "This asset can't be retired."}
        body="Return to the asset profile to view its current details."
        action={<Button asChild variant="outline" size="sm"><Link href={href}>View Asset Profile</Link></Button>}
      />
    );
  }
  return flow.step === 1 ? <RetireReview asset={asset} flow={flow} /> : <RetireDetails asset={asset} flow={flow} fromAssignments={fromAssignments} />;
}
