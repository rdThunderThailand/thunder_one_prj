"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/lovable/button";
import { ArrowRightIcon, ChevronRightIcon, TrashIcon } from "@/components/ui/icons";
import { DISPOSE_STEPS, DISPOSE_SUBTITLE, DISPOSE_TITLE } from "../../domain/asset-lifecycle-actions";
import { profileHref } from "../../domain/assignment-assign";
import { useDisposeFlow, type DisposeFlow } from "../../hooks/use-dispose-flow";
import { ActionLayout, AssignFlowTitle } from "../assignments/AssignFlowHeader";
import { AssignFlowWorkspace } from "../assignments/AssignFlowWorkspace";
import { lifecycleWriteText } from "../assignments/assignment-error-text";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import {
  ChangeStatusFieldsLoading, ChangeStatusFooterLoading, ChangeStatusRailLoading, changeStatusBodyClass,
  changeStatusFooterColumns, changeStatusFooterFrame, changeStatusFooterSurface,
} from "./ChangeStatusLoading";
import { DisposeDetails } from "./DisposeDetails";
import { DisposeConfirm, DisposeReview } from "./DisposeReview";
import { DisposeSummary } from "./DisposeSummary";

const denied = (code?: string) => code === "PERMISSION_DENIED" || code === "UNAUTHENTICATED";
const secondaryAction = "min-w-20 max-sm:h-10";

function DisposeFooter({ flow, href }: { flow: DisposeFlow; href: string }) {
  const sending = flow.save.phase === "sending" || flow.done;
  const last = flow.step === 2;
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
        {flow.step > 0 ? (
          <Button type="button" variant="outline" size="sm" className={secondaryAction} disabled={sending} onClick={flow.back}>Back</Button>
        ) : cancel}
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          {flow.step > 0 && cancel}
          {last ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="min-w-36 max-sm:h-10"
              disabled={!flow.canConfirm}
              onClick={flow.confirm}
            >
              <TrashIcon aria-hidden="true" className="size-4" />
              {sending ? "Disposing…" : "Confirm Disposal"}
            </Button>
          ) : (
            <Button type="button" size="sm" className="min-w-28 max-sm:h-10" disabled={!flow.canNext} onClick={flow.next}>
              {flow.step === 1 ? "Next: Confirm" : "Next"}
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
}

export function DisposeFlowView({ context, assetId, from }: { context: string; assetId: string; from?: string }) {
  const fromAssignments = from === "assignments";
  const href = profileHref(assetId, fromAssignments);
  const flow = useDisposeFlow(context, assetId, href);
  const listHref = fromAssignments ? "/asset-workspace/assignments" : "/asset-workspace/assets";
  const name = flow.asset ? `${flow.asset.name} (${flow.asset.assetTag})` : "Asset Profile";
  const waiting = !flow.detail.result || !flow.options.result;
  const showForm = Boolean(flow.asset && flow.options.result?.ok && !flow.block);
  const body = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const lastStep = useRef(flow.step);
  const saving = flow.save.phase === "sending" || flow.done;

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
        <span aria-current="page" className="font-semibold text-foreground">{DISPOSE_TITLE}</span>
      </nav>
      <div ref={body} data-assign-body className={changeStatusBodyClass}>
        <ActionLayout
          head={(
            <div inert={saving || undefined} className="rounded-card border border-border bg-card p-4">
              <AssignFlowTitle
                origin={{ href, label: "Asset Profile" }}
                steps={DISPOSE_STEPS}
                step={flow.step}
                title={DISPOSE_TITLE}
                subtitle={DISPOSE_SUBTITLE}
              />
            </div>
          )}
          main={(
            <div ref={stage} tabIndex={-1} aria-label={DISPOSE_STEPS[flow.step]} aria-busy={saving || waiting} className="min-w-0 space-y-3 focus:outline-none">
              {flow.save.phase === "failed" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-error/20 bg-error-muted p-3">
                  <p role="alert" className="text-xs">{lifecycleWriteText(flow.save.code, flow.save.uncertain)}</p>
                  {flow.needsReload && <Button type="button" variant="outline" size="sm" onClick={flow.reload}>Reload</Button>}
                </div>
              )}
              <DisposeContent flow={flow} href={href} />
            </div>
          )}
          panel={showForm && flow.asset ? <DisposeSummary asset={flow.asset} flow={flow} /> : waiting ? <ChangeStatusRailLoading /> : undefined}
        />
      </div>
      {showForm ? <DisposeFooter flow={flow} href={href} /> : waiting ? <ChangeStatusFooterLoading /> : null}
    </AssignFlowWorkspace>
  );
}

function DisposeContent({ flow, href }: { flow: DisposeFlow; href: string }) {
  const { detail, options, asset } = flow;
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
  if (!asset || flow.block) {
    return (
      <EmptyState
        title={flow.block ?? "This asset can't be disposed."}
        body="Return to the asset profile to view its current details."
        action={<Button asChild variant="outline" size="sm"><Link href={href}>View Asset Profile</Link></Button>}
      />
    );
  }
  if (flow.step === 2) return <DisposeConfirm asset={asset} flow={flow} />;
  return flow.step === 1 ? <DisposeReview asset={asset} flow={flow} /> : <DisposeDetails flow={flow} />;
}
