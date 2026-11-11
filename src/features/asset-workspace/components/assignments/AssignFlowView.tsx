"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/lovable/button";
import { locationTrail } from "../../domain/asset-profile";
import { actionHref, profileHref, assetAssignBlock, assignBlockText, assignOrigin, assignOutcomes } from "../../domain/assignment-assign";
import { ErrorState } from "../states/ErrorState";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { ActionFooter } from "./ActionFooter";
import { assignmentWriteText } from "./assignment-error-text";
import { AssignDetailsForm } from "./AssignDetailsForm";
import { ActionLayout, AssignFlowCrumb, AssignFlowTitle } from "./AssignFlowHeader";
import { AssignLoadingMain, AssignLoadingPanel } from "./AssignFlowLoading";
import { AssignFlowWorkspace } from "./AssignFlowWorkspace";
import { AssignResult } from "./AssignResult";
import { AssignReview } from "./AssignReview";
import { AssignSelectAsset } from "./AssignSelectAsset";
import { AssignSidePanel } from "./AssignSidePanel";
import { useAssignFlow, type AssignFlow } from "./use-assign-flow";

const denied = (code?: string) => code === "PERMISSION_DENIED" || code === "UNAUTHENTICATED";

/** FE 02 Assign flow: `/assignments/assign` (with Select Asset), `/assignments/{id}/assign` or `/assets/{id}/assign` (asset known). */
export function AssignFlowView({ context, assetId, from }: { context: string; assetId: string | null; from?: string }) {
  const flow = useAssignFlow(context, assetId);
  const origin = assignOrigin(from, assetId);
  const body = content(context, flow, from === "assignments" || !assetId);
  const showFooter = !flow.saved && body.form;
  return (
    <AssignFlowWorkspace>
      <AssignFlowCrumb
        origin={origin}
        assetId={assetId}
        assetName={flow.asset?.name}
        title="Assign Asset"
      />
      <div
        data-assign-body
        className="min-w-0 p-1 group-data-[bounded=true]/assign-flow:min-h-0 group-data-[bounded=true]/assign-flow:flex-1 group-data-[bounded=true]/assign-flow:overflow-y-auto"
      >
        <ActionLayout
          head={(
            <AssignFlowTitle
              origin={origin}
              title="Assign Asset"
              subtitle="Assign this asset to a person or team."
              steps={flow.steps}
              step={flow.step}
              mockNote
            />
          )}
          main={body.node}
          panel={body.panel}
        />
      </div>
      {showFooter && (
        <ActionFooter
          cancelHref={origin.href}
          showBack={flow.step > 0}
          sending={flow.save.phase === "sending"}
          review={flow.name === "Review"}
          canNext={flow.canNext}
          canConfirm={!flow.detail.pending && Boolean(flow.asset && flow.target)}
          confirmLabel="Confirm Assignment"
          sendingLabel="Assigning…"
          onBack={flow.back}
          onNext={flow.next}
          onConfirm={flow.confirm}
        />
      )}
    </AssignFlowWorkspace>
  );
}

function content(context: string, flow: AssignFlow, fromAssignments: boolean): { node: ReactNode; panel?: ReactNode; form: boolean } {
  const options = flow.options.result;
  if (flow.saved) return { node: <AssignResult before={flow.saved.before} after={flow.saved.after} />, form: false };
  if (!options) return { node: <AssignLoadingMain />, panel: <AssignLoadingPanel />, form: false };
  if (!options.ok) {
    return { form: false, node: denied(options.code) ? <AccessDeniedState body={assignmentWriteText(options.code ?? "")} />
      : <ErrorState title="Couldn't load the assign form" body="The custodian options could not be loaded. Check your connection and retry." onRetry={flow.options.reload} /> };
  }
  const location = flow.asset ? locationTrail(flow.asset.locationPath, flow.asset.location) || null : null;
  const panel = (
    <AssignSidePanel
      title="Assign Summary"
      asset={flow.asset}
      thumbnailUrl={flow.picked?.thumbnailUrl ?? flow.photo}
      from={{ holder: null, empty: "No current custodian", location }}
      to={{ holder: flow.target, empty: "Choose a person or team" }}
      outcomes={assignOutcomes(flow.target?.name ?? null, location)}
      recent={flow.recent.result ?? null}
      noAsset={!flow.assetId}
    />
  );
  if (flow.name === "Select Asset") return { node: <AssignSelectAsset context={context} flow={flow} />, panel, form: true };
  const detail = flow.detail.result;
  if (!detail) return { node: <AssignLoadingMain />, panel: <AssignLoadingPanel />, form: false };
  if (!detail.ok) {
    const node = detail.code === "NOT_FOUND" ? <NotFoundState title="Asset not found" body={detail.message} />
      : denied(detail.code) ? <AccessDeniedState body={detail.message} />
        : <ErrorState title="Couldn't load this asset" body={detail.message} onRetry={flow.detail.reload} />;
    return { node, form: false };
  }
  const block = assetAssignBlock(detail.data);
  if (block) {
    const text = assignBlockText(block);
    const action = (
      <Button
        asChild
        variant="outline"
        size="sm"
      >
        <Link href={block === "has_custody" ? actionHref(detail.data.id, "transfer", fromAssignments) : profileHref(detail.data.id, fromAssignments)}>
          {block === "has_custody" ? "Transfer" : "View Asset"}
        </Link>
      </Button>
    );
    return { node: <EmptyState title={text.title} body={text.body} action={action} />, form: false };
  }
  const main = flow.name === "Review" ? <AssignReview flow={flow} asset={detail.data} />
    : <AssignDetailsForm context={context} flow={flow} asset={detail.data} rules={options.data} />;
  return { node: main, panel, form: true };
}
