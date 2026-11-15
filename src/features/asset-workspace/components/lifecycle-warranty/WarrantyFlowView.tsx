"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/lovable/button";
import { ArrowRightIcon, CheckIcon, ChevronRightIcon } from "@/components/ui/icons";
import { profileHref } from "../../domain/assignment-assign";
import {
  ADD_WARRANTY_TITLE, DISPOSED_WARRANTY_TEXT, EDIT_WARRANTY_TITLE, WARRANTY_SUBTITLE, warrantySteps, warrantyWriteText,
} from "../../domain/warranty-form";
import { ActionLayout, AssignFlowTitle } from "../assignments/AssignFlowHeader";
import { AssignFlowWorkspace } from "../assignments/AssignFlowWorkspace";
import {
  ChangeStatusFieldsLoading, ChangeStatusFooterLoading, ChangeStatusRailLoading, changeStatusBodyClass,
  changeStatusFooterColumns, changeStatusFooterFrame, changeStatusFooterSurface,
} from "../lifecycle/ChangeStatusLoading";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { useWarrantyFlow, type WarrantyFlow } from "./use-warranty-flow";
import { WarrantyDetails } from "./WarrantyDetails";
import { WarrantyResult, WarrantyReview } from "./WarrantyReview";
import { WarrantySelectAsset } from "./WarrantySelectAsset";
import { WarrantySummary } from "./WarrantySummary";

const WARRANTY_TAB = "/asset-workspace/lifecycle-warranty?tab=warranty";
const denied = (code?: string) => code === "PERMISSION_DENIED" || code === "UNAUTHENTICATED";
const secondaryAction = "min-w-20 max-sm:h-10";

function WarrantyFooter({ flow, back, profile }: { flow: WarrantyFlow; back: string; profile: string | null }) {
  if (flow.saved) {
    return (
      <footer className={changeStatusFooterFrame}>
        <div className={changeStatusFooterSurface}>
          <div className="ml-auto flex flex-wrap justify-end gap-2">
            <Button asChild variant="outline" size="sm" className={secondaryAction}>
              <Link href={WARRANTY_TAB}>Go to Warranty</Link>
            </Button>
            {profile && (
              <Button asChild size="sm" className="min-w-36 max-sm:h-10">
                <Link href={profile}>
                  View Asset Profile
                  <ArrowRightIcon aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </footer>
    );
  }
  const sending = flow.save.phase === "sending";
  const review = flow.step === "review";
  const canGoBack = review || (flow.step === "details" && Boolean(flow.picked));
  const cancel = sending ? (
    <Button variant="outline" size="sm" className={secondaryAction} disabled>Cancel</Button>
  ) : (
    <Button asChild variant="outline" size="sm" className={secondaryAction}>
      <Link href={back}>Cancel</Link>
    </Button>
  );
  return (
    <footer className={`${changeStatusFooterFrame} ${changeStatusFooterColumns}`}>
      <div className={changeStatusFooterSurface}>
        {canGoBack ? (
          <Button type="button" variant="outline" size="sm" className={secondaryAction} disabled={sending} onClick={flow.back}>Back</Button>
        ) : cancel}
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          {canGoBack && cancel}
          <Button
            type="button"
            size="sm"
            className={review ? "min-w-36 max-sm:h-10" : "min-w-28 max-sm:h-10"}
            disabled={review ? !flow.canConfirm : flow.step === "select" ? !flow.picked : !flow.canNext}
            onClick={review ? flow.confirm : flow.next}
          >
            {review && !sending && <CheckIcon aria-hidden="true" className="size-4" />}
            {sending ? "Saving…" : review ? "Confirm" : "Next"}
            {!sending && !review && <ArrowRightIcon aria-hidden="true" className="size-4" />}
          </Button>
        </div>
      </div>
    </footer>
  );
}

/** FE 04 Add / Edit Warranty, laid out like Retire. `assetId` null = list route (starts with Select Asset). */
export function WarrantyFlowView({ context, assetId, warrantyId, from }: {
  context: string; assetId: string | null; warrantyId: string | null; from?: string;
}) {
  const flow = useWarrantyFlow(context, assetId, warrantyId);
  const id = assetId ?? flow.picked?.id ?? null;
  const profile = id ? profileHref(id, false) : null;
  const back = from === "profile" && profile ? profile : WARRANTY_TAB;
  const title = flow.edit ? EDIT_WARRANTY_TITLE : ADD_WARRANTY_TITLE;
  const steps = warrantySteps(!assetId);
  const index = steps.indexOf(flow.step === "select" ? "Select Asset"
    : flow.step === "details" ? "Warranty Information" : flow.step === "review" ? "Review" : "Result");
  const number = index + 1;
  const saving = flow.save.phase === "sending";
  const waiting = flow.step !== "select" && !flow.ready && !flow.saved;
  const body = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const lastStep = useRef(flow.step);

  useEffect(() => {
    if (lastStep.current === flow.step) return;
    lastStep.current = flow.step;
    body.current?.scrollTo({ top: 0 });
    stage.current?.focus({ preventScroll: true });
  }, [flow.step]);

  const showFooter = flow.step === "select" || flow.saved || (flow.ready && !flow.disposed);
  return (
    <AssignFlowWorkspace>
      <nav aria-label="Breadcrumb" inert={saving || undefined} className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link className="hover:underline" href={WARRANTY_TAB}>Lifecycle &amp; Warranty</Link>
        {flow.asset && profile && (
          <>
            <ChevronRightIcon aria-hidden="true" className="size-3 shrink-0" />
            <Link className="min-w-0 wrap-anywhere hover:underline" href={profile}>{`${flow.asset.name} (${flow.asset.assetTag})`}</Link>
          </>
        )}
        <ChevronRightIcon aria-hidden="true" className="size-3 shrink-0" />
        <span aria-current="page" className="font-semibold text-foreground">{title}</span>
      </nav>
      <div ref={body} data-assign-body className={changeStatusBodyClass}>
        <ActionLayout
          head={(
            <div inert={saving || undefined} className="rounded-card border border-border bg-card p-4">
              <AssignFlowTitle
                origin={{ href: back, label: back === WARRANTY_TAB ? "Warranty" : "Asset Profile" }}
                steps={steps}
                step={Math.max(0, index)}
                title={title}
                subtitle={flow.saved ? "The warranty has been saved." : WARRANTY_SUBTITLE}
              />
            </div>
          )}
          main={(
            <div ref={stage} tabIndex={-1} aria-label={steps[index]} aria-busy={saving || waiting} className="min-w-0 space-y-3 focus:outline-none">
              {flow.save.phase === "failed" && !flow.disposed && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-error/20 bg-error-muted p-3">
                  <p role="alert" className="text-xs">{warrantyWriteText(flow.save.code, flow.save.uncertain)}</p>
                  {flow.needsReload && <Button type="button" variant="outline" size="sm" onClick={flow.reload}>Reload</Button>}
                </div>
              )}
              {flow.step === "select"
                ? <WarrantySelectAsset context={context} flow={flow} />
                : <WarrantyContent flow={flow} profile={profile} number={number} />}
            </div>
          )}
          panel={flow.step === "select" ? undefined : flow.asset ? <WarrantySummary asset={flow.asset} flow={flow} />
            : waiting ? <ChangeStatusRailLoading /> : undefined}
        />
      </div>
      {showFooter ? <WarrantyFooter flow={flow} back={back} profile={profile} /> : waiting ? <ChangeStatusFooterLoading /> : null}
    </AssignFlowWorkspace>
  );
}

function WarrantyContent({ flow, profile, number }: { flow: WarrantyFlow; profile: string | null; number: number }) {
  const { detail, records, options, asset } = flow;
  if (flow.saved && asset) return <WarrantyResult asset={asset} flow={flow} />;
  if (!detail.result || !records.result || !options.result) {
    return (
      <>
        <p role="status" className="sr-only">Loading asset…</p>
        <ChangeStatusFieldsLoading />
      </>
    );
  }
  const failed = [detail.result, records.result, options.result].find((result) => !result.ok);
  if (failed && !failed.ok) {
    if (failed.code === "NOT_FOUND") return <NotFoundState title="Asset not found" />;
    if (denied(failed.code)) return <AccessDeniedState />;
    const retry = () => { detail.reload(); records.reload(); options.reload(); };
    return <ErrorState title="Couldn't load this asset" body="The asset or its warranties could not be loaded. Check your connection and retry." onRetry={retry} />;
  }
  if (flow.edit && !flow.record) return <NotFoundState title="Warranty not found" />;
  if (!asset || flow.disposed) {
    return (
      <EmptyState
        title={DISPOSED_WARRANTY_TEXT}
        body="Return to the asset profile to view its warranty history."
        action={profile ? <Button asChild variant="outline" size="sm"><Link href={profile}>View Asset Profile</Link></Button> : undefined}
      />
    );
  }
  return flow.step === "review" ? <WarrantyReview asset={asset} flow={flow} number={number} /> : <WarrantyDetails flow={flow} number={number} />;
}
