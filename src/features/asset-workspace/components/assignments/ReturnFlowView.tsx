"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/lovable/button";
import { locationTrail } from "../../domain/asset-profile";
import { assignOrigin, profileHref } from "../../domain/assignment-assign";
import { assetReturnBlock, returnOutcomes } from "../../domain/assignment-return";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { ActionFooter } from "./ActionFooter";
import { ActionLayout, AssignFlowCrumb, AssignFlowTitle } from "./AssignFlowHeader";
import { AssignLoadingMain, AssignLoadingPanel } from "./AssignFlowLoading";
import { AssignFlowWorkspace } from "./AssignFlowWorkspace";
import { AssignSidePanel } from "./AssignSidePanel";
import { assignmentWriteText } from "./assignment-error-text";
import { ReturnDetailsForm } from "./ReturnDetailsForm";
import { ReturnResult, ReturnReview } from "./ReturnReview";
import { useReturnFlow, type ReturnFlow } from "./use-return-flow";

export const RETURN_TITLE = { title: "Return Asset", subtitle: "Return this asset from its current custodian." };
const denied = (code?: string) => code === "PERMISSION_DENIED" || code === "UNAUTHENTICATED";

export function ReturnFlowView({ context, assetId, from }: { context: string; assetId: string; from?: string }) {
  const flow = useReturnFlow(context, assetId);
  const origin = assignOrigin(from, assetId);
  const body = content(flow, from === "assignments");
  return (
    <AssignFlowWorkspace>
      <AssignFlowCrumb origin={origin} assetId={assetId} assetName={flow.asset?.name} title={RETURN_TITLE.title} />
      <div data-assign-body className="relative min-w-0 p-1 group-data-[bounded=true]/assign-flow:min-h-0 group-data-[bounded=true]/assign-flow:flex-1 group-data-[bounded=true]/assign-flow:overflow-y-auto">
        <ActionLayout
          head={<AssignFlowTitle origin={origin} steps={flow.steps} step={flow.step} {...RETURN_TITLE} />}
          main={body.node}
          panel={body.panel}
        />
      </div>
      {!flow.saved && body.form && (
        <ActionFooter
          cancelHref={origin.href}
          showBack={flow.step > 0}
          sending={flow.save.phase === "sending"}
          review={flow.name === "Review"}
          reviewCancel
          canNext={flow.canNext}
          canConfirm={flow.canConfirm}
          confirmLabel="Confirm Return"
          sendingLabel="Returning…"
          onBack={flow.back}
          onNext={flow.next}
          onConfirm={flow.confirm}
        />
      )}
    </AssignFlowWorkspace>
  );
}

function content(flow: ReturnFlow, fromAssignments: boolean): { node: ReactNode; panel?: ReactNode; form: boolean } {
  if (flow.saved) return { node: <ReturnResult flow={flow} />, form: false };
  const detail = flow.detail.result;
  const options = flow.options.result;
  if (!detail || !options) return { node: <AssignLoadingMain kind="return" />, panel: <AssignLoadingPanel />, form: false };
  if (!detail.ok) {
    const node = detail.code === "NOT_FOUND" ? <NotFoundState title="Asset not found" action={(
      <Button variant="outline" size="sm" onClick={flow.detail.reload}>Reload</Button>
    )} /> : denied(detail.code) ? <AccessDeniedState body={assignmentWriteText(detail.code ?? "", false, "return")} />
      : <ErrorState title="Couldn't load this asset" body="The asset could not be loaded. Check your connection and retry." onRetry={flow.detail.reload} />;
    return { node, form: false };
  }
  if (!options.ok) {
    return { form: false, node: denied(options.code)
      ? <AccessDeniedState body={assignmentWriteText(options.code ?? "", false, "return")} />
      : <ErrorState title="Couldn't load the return form" body="The upload settings could not be loaded. Check your connection and retry." onRetry={flow.options.reload} /> };
  }
  const asset = detail.data;
  if (assetReturnBlock(asset)) {
    return { form: false, node: (
      <EmptyState title="This asset can't be returned" body="Only Assigned assets with a current custodian can be returned." action={(
        <Button asChild variant="outline" size="sm">
          <Link href={profileHref(asset.id, fromAssignments)}>View Asset</Link>
        </Button>
      )} />
    ) };
  }
  const location = locationTrail(asset.locationPath, asset.location) || null;
  return {
    form: true,
    node: flow.name === "Review" ? (
      <ReturnReview flow={flow} asset={asset} />
    ) : (
      <ReturnDetailsForm flow={flow} asset={asset} />
    ),
    panel: (
      <div className="min-w-0 space-y-2">
        <AssignSidePanel
          title="Return Summary"
          toLabel="To (Return)"
          asset={asset}
          thumbnailUrl={flow.photo}
          from={{ holder: asset.custody && { ...asset.custody, secondary: asset.custody.department?.name }, empty: "No current custodian", location, since: asset.custody?.since }}
          to={{ holder: null, empty: "Unassigned", location }}
          outcomes={returnOutcomes()}
          outcomesTitle={flow.name === "Review" ? "What will happen after confirmation?" : undefined}
          recent={flow.recent.result ?? null}
        />
        {flow.recent.result && !flow.recent.result.ok && (
          <Button variant="outline" size="sm" onClick={flow.recent.reload}>Retry history</Button>
        )}
      </div>
    ),
  };
}
