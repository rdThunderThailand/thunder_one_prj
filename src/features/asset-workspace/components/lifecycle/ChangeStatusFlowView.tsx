"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/lovable/button";
import { ArrowRightIcon, CheckIcon, ChevronRightIcon } from "@/components/ui/icons";
import {
  allowedTargets, CHANGE_STATUS_STEPS, CHANGE_STATUS_SUBTITLE, CHANGE_STATUS_TITLE,
} from "../../domain/asset-lifecycle-actions";
import { profileHref } from "../../domain/assignment-assign";
import { useChangeStatusFlow, type ChangeStatusFlow } from "../../hooks/use-change-status-flow";
import { ActionLayout, AssignFlowTitle } from "../assignments/AssignFlowHeader";
import { AssignFlowWorkspace } from "../assignments/AssignFlowWorkspace";
import { lifecycleWriteText } from "../assignments/assignment-error-text";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { ChangeStatusDetails } from "./ChangeStatusDetails";
import {
  ChangeStatusFieldsLoading, ChangeStatusFooterLoading, ChangeStatusRailLoading, changeStatusBodyClass,
  changeStatusFooterColumns, changeStatusFooterFrame, changeStatusFooterSurface,
} from "./ChangeStatusLoading";
import { ChangeStatusReview } from "./ChangeStatusReview";
import { ChangeStatusResult } from "./ChangeStatusResult";
import { LifecycleSummary } from "./LifecycleSummary";

const denied = (code?: string) => code === "PERMISSION_DENIED" || code === "UNAUTHENTICATED";
const secondaryAction = "min-w-20 max-sm:h-10";

function ChangeStatusFooter({ flow, href }: { flow: ChangeStatusFlow; href: string }) {
  if (flow.saved) {
    return (
      <footer className={changeStatusFooterFrame}>
        <div className={changeStatusFooterSurface}>
          <Button asChild variant="outline" size="sm" className={secondaryAction}>
            <Link href={`${href}?tab=overview`}>Back to Asset</Link>
          </Button>
          <div className="ml-auto flex flex-wrap justify-end gap-2">
            <Button asChild variant="outline" size="sm" className={secondaryAction}>
              <Link href={`${href}?tab=history`}>View Status History</Link>
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
            {!review && <ArrowRightIcon aria-hidden="true" className="size-4" />}
          </Button>
        </div>
      </div>
    </footer>
  );
}

export function ChangeStatusFlowView({ context, assetId, from, actor }: {
  context: string; assetId: string; from?: string; actor: string;
}) {
  const flow = useChangeStatusFlow(context, assetId);
  const fromAssignments = from === "assignments";
  const href = profileHref(assetId, fromAssignments);
  const origin = { href, label: "Asset Profile" };
  const listHref = fromAssignments ? "/asset-workspace/assignments" : "/asset-workspace/assets";
  const listLabel = fromAssignments ? "Assignments" : "Assets";
  const name = flow.asset ? `${flow.asset.name} (${flow.asset.assetTag})` : "Asset Profile";
  const loaded = Boolean(flow.asset && flow.options.result?.ok);
  const waiting = !flow.saved && (!flow.detail.result || !flow.options.result);
  const showForm = loaded && flow.asset && allowedTargets(flow.asset).length > 0;
  const summary = flow.saved?.after ?? (showForm ? flow.asset : null);
  const body = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const lastStep = useRef(flow.step);
  const saving = flow.save.phase === "sending";

  useEffect(() => {
    if (lastStep.current === flow.step) return;
    lastStep.current = flow.step;
    body.current?.scrollTo({ top: 0 });
    stage.current?.focus({ preventScroll: true });
  }, [flow.step]);

  return (
    <AssignFlowWorkspace>
      <nav aria-label="Breadcrumb" inert={saving || undefined} className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link className="hover:underline" href={listHref}>{listLabel}</Link>
        <ChevronRightIcon aria-hidden="true" className="size-3 shrink-0" />
        <Link className="min-w-0 wrap-anywhere hover:underline" href={href}>{name}</Link>
        <ChevronRightIcon aria-hidden="true" className="size-3 shrink-0" />
        <span aria-current="page" className="font-semibold text-foreground">{CHANGE_STATUS_TITLE}</span>
      </nav>
      <div ref={body} data-assign-body className={changeStatusBodyClass}>
        <ActionLayout
          head={(
            <div inert={saving || undefined} className="rounded-card border border-border bg-card p-4">
              <AssignFlowTitle
                origin={origin}
                steps={CHANGE_STATUS_STEPS}
                step={flow.step}
                title={CHANGE_STATUS_TITLE}
                subtitle={CHANGE_STATUS_SUBTITLE}
              />
            </div>
          )}
          main={(
            <div ref={stage} tabIndex={-1} aria-label={CHANGE_STATUS_STEPS[flow.step]} aria-busy={saving || waiting} className="min-w-0 space-y-3 focus:outline-none">
              {flow.save.phase === "failed" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-error/20 bg-error-muted p-3">
                  <p role="alert" className="text-xs">{lifecycleWriteText(flow.save.code, flow.save.uncertain)}</p>
                  {flow.needsReload && <Button type="button" variant="outline" size="sm" onClick={flow.reload}>Reload</Button>}
                </div>
              )}
              <ChangeStatusContent flow={flow} actor={actor} href={href} />
            </div>
          )}
          panel={summary ? <LifecycleSummary asset={summary} flow={flow} /> : waiting ? <ChangeStatusRailLoading /> : undefined}
        />
      </div>
      {flow.saved || showForm ? <ChangeStatusFooter flow={flow} href={href} /> : waiting ? <ChangeStatusFooterLoading /> : null}
    </AssignFlowWorkspace>
  );
}

function ChangeStatusContent({ flow, actor, href }: { flow: ChangeStatusFlow; actor: string; href: string }) {
  if (flow.saved) return <ChangeStatusResult saved={flow.saved} actor={actor} />;
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
  if (!asset || !allowedTargets(asset).length) {
    return (
      <EmptyState
        title={asset?.lifecycleStatus === "Disposed" ? "Disposed assets can't change." : "This asset's status can't be changed."}
        body="Return to the asset profile to view its current details."
        action={<Button asChild variant="outline" size="sm"><Link href={href}>View Asset Profile</Link></Button>}
      />
    );
  }
  return flow.step === 1 ? <ChangeStatusReview asset={asset} flow={flow} /> : <ChangeStatusDetails asset={asset} flow={flow} />;
}
