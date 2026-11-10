"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/lovable/button";
import { locationTrail } from "../../domain/asset-profile";
import { actionHref, assignOrigin } from "../../domain/assignment-assign";
import { assetTransferBlock, transferBlockText, transferOutcomes } from "../../domain/assignment-transfer";
import { ErrorState } from "../states/ErrorState";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { ActionFooter } from "./ActionFooter";
import { assignmentWriteText } from "./assignment-error-text";
import { ActionLayout, AssignFlowCrumb, AssignFlowTitle } from "./AssignFlowHeader";
import { AssignLoadingMain, AssignLoadingPanel } from "./AssignFlowLoading";
import { AssignFlowWorkspace } from "./AssignFlowWorkspace";
import { AssignResult } from "./AssignResult";
import { AssignSidePanel } from "./AssignSidePanel";
import { TransferDetailsForm } from "./TransferDetailsForm";
import { TransferReview } from "./TransferReview";
import { useTransferFlow, type TransferFlow } from "./use-transfer-flow";

const denied = (code?: string) => code === "PERMISSION_DENIED" || code === "UNAUTHENTICATED";
export const TRANSFER_TITLE = { title: "Transfer Asset", subtitle: "Transfer this asset to a new custodian." };

/** FE 03 Transfer flow: `/assignments/{id}/transfer` from the FE 01 row menu, `/assets/{id}/transfer` from the profile. */
export function TransferFlowView({ context, assetId, from }: { context: string; assetId: string; from?: string }) {
  const flow = useTransferFlow(context, assetId);
  const origin = assignOrigin(from, assetId);
  const fromAssignments = from === "assignments";
  const body = content(context, flow, fromAssignments);
  return (
    <AssignFlowWorkspace>
      <AssignFlowCrumb
        origin={origin}
        assetId={assetId}
        assetName={flow.asset?.name}
        title={TRANSFER_TITLE.title}
      />
      <div
        data-assign-body
        className="min-w-0 p-1 group-data-[bounded=true]/assign-flow:min-h-0 group-data-[bounded=true]/assign-flow:flex-1 group-data-[bounded=true]/assign-flow:overflow-y-auto"
      >
        <ActionLayout
          head={(
            <AssignFlowTitle
              origin={origin}
              steps={flow.steps}
              step={flow.step}
              {...TRANSFER_TITLE}
            />
          )}
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
          canNext={flow.canNext}
          canConfirm={!flow.detail.pending && Boolean(flow.asset && flow.target)}
          confirmLabel="Confirm Transfer"
          sendingLabel="Transferring…"
          onBack={flow.back}
          onNext={flow.next}
          onConfirm={flow.confirm}
        />
      )}
    </AssignFlowWorkspace>
  );
}

function content(context: string, flow: TransferFlow, fromAssignments: boolean): { node: ReactNode; panel?: ReactNode; form: boolean } {
  if (flow.saved) {
    return { node: <AssignResult before={flow.saved.before} after={flow.saved.after} title="Asset transferred" />, form: false };
  }
  const options = flow.options.result;
  const detail = flow.detail.result;
  if (!options || !detail) return { node: <AssignLoadingMain kind="transfer" />, panel: <AssignLoadingPanel />, form: false };
  if (!options.ok) {
    return { form: false, node: denied(options.code) ? <AccessDeniedState body={assignmentWriteText(options.code ?? "", false, "transfer")} />
      : <ErrorState title="Couldn't load the transfer form" body="The custodian options could not be loaded. Check your connection and retry." onRetry={flow.options.reload} /> };
  }
  if (!detail.ok) {
    const node = detail.code === "NOT_FOUND" ? <NotFoundState title="Asset not found" />
      : denied(detail.code) ? <AccessDeniedState />
        : <ErrorState title="Couldn't load this asset" body="The asset could not be loaded. Check your connection and retry." onRetry={flow.detail.reload} />;
    return { node, form: false };
  }
  const asset = detail.data;
  const block = assetTransferBlock(asset);
  if (block) {
    const text = transferBlockText(block);
    const action = block === "no_custody" ? { href: actionHref(asset.id, "assign", fromAssignments), label: "Assign" }
      : block === "condition_blocks_transfer" ? { href: actionHref(asset.id, "return", fromAssignments), label: "Return" }
        : { href: `/asset-workspace/assets/${encodeURIComponent(asset.id)}`, label: "View Asset" };
    const button = (
      <Button
        asChild
        variant="outline"
        size="sm"
      >
        <Link href={action.href}>{action.label}</Link>
      </Button>
    );
    return { node: <EmptyState title={text.title} body={text.body} action={button} />, form: false };
  }
  const current = locationTrail(asset.locationPath, asset.location) || null;
  const next = flow.location?.name ?? null;
  const main = flow.name === "Review" ? (
    <TransferReview
      flow={flow}
      asset={asset}
    />
  ) : (
    <TransferDetailsForm
      context={context}
      flow={flow}
      asset={asset}
      rules={options.data}
      returnHref={`${actionHref(asset.id, "return", fromAssignments)}?${new URLSearchParams({ condition: flow.condition ?? "" })}`}
    />
  );
  const custody = asset.custody;
  return {
    form: true,
    node: main,
    panel: (
      <AssignSidePanel
        title="Transfer Summary"
        asset={asset}
        thumbnailUrl={flow.photo}
        from={{ holder: custody && { ...custody, secondary: custody.department?.name }, empty: "No current custodian", location: current, since: custody?.since }}
        to={{ holder: flow.target, empty: "Choose a person or team", location: flow.location && flow.location.id !== asset.location?.id ? next : current }}
        outcomes={transferOutcomes(flow.target?.name ?? null, current, flow.location && flow.location.id !== asset.location?.id ? next : null)}
        recent={flow.recent.result ?? null}
      />
    ),
  };
}
