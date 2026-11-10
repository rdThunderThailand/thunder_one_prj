"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/lovable/button";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";
import { assetAssignBlock, assignBlockText, assignOrigin } from "../../domain/assignment-assign";
import { ErrorState } from "../states/ErrorState";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { assignmentWriteText } from "./assignment-error-text";
import { AssignDetailsForm } from "./AssignDetailsForm";
import { AssignFlowHeader } from "./AssignFlowHeader";
import { AssignFlowBodyLoading } from "./AssignFlowLoading";
import { AssignFlowWorkspace } from "./AssignFlowWorkspace";
import { AssignResult } from "./AssignResult";
import { AssignReview } from "./AssignReview";
import { AssignSelectAsset } from "./AssignSelectAsset";
import { AssignSidePanel } from "./AssignSidePanel";
import { useAssignFlow, type AssignFlow } from "./use-assign-flow";

const denied = (code?: string) => code === "PERMISSION_DENIED" || code === "UNAUTHENTICATED";

/** FE 02 Assign flow: `/assignments/assign` (with Select Asset) or `/assets/{id}/assign` (asset known). */
export function AssignFlowView({ context, assetId, from }: { context: string; assetId: string | null; from?: string }) {
  const flow = useAssignFlow(context, assetId);
  const origin = assignOrigin(from, assetId);
  const body = content(context, flow, assetId);
  const showFooter = !flow.saved && body.form;
  return (
    <AssignFlowWorkspace>
      <AssignFlowHeader
        origin={origin}
        assetId={assetId}
        assetName={flow.asset?.name}
        steps={flow.steps}
        step={flow.step}
      />
      <div
        data-assign-body
        className="min-w-0 p-1 group-data-[bounded=true]/assign-flow:min-h-0 group-data-[bounded=true]/assign-flow:flex-1 group-data-[bounded=true]/assign-flow:overflow-y-auto"
      >
        {body.node}
      </div>
      {showFooter && (
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="max-sm:h-10"
          >
            <Link href={origin.href}>Cancel</Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            {flow.step > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="max-sm:h-10"
                disabled={flow.save.phase === "sending"}
                onClick={flow.back}
              >
                <ArrowLeftIcon
                  aria-hidden="true"
                  className="size-4"
                />
                Back
              </Button>
            )}
            {flow.name === "Review" ? (
              <Button
                type="button"
                size="sm"
                className="max-sm:h-10"
                disabled={flow.save.phase === "sending" || flow.detail.pending || !flow.asset || !flow.target}
                onClick={flow.confirm}
              >
                {flow.save.phase === "sending" ? "Assigning…" : "Confirm Assignment"}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="max-sm:h-10"
                disabled={!flow.canNext}
                onClick={flow.next}
              >
                Next
                <ArrowRightIcon
                  aria-hidden="true"
                  className="size-4"
                />
              </Button>
            )}
          </div>
        </footer>
      )}
    </AssignFlowWorkspace>
  );
}

function content(context: string, flow: AssignFlow, routeAssetId: string | null): { node: ReactNode; form: boolean } {
  const options = flow.options.result;
  if (flow.saved) return { node: <AssignResult before={flow.saved.before} after={flow.saved.after} />, form: false };
  if (!options) return { node: <AssignFlowBodyLoading />, form: false };
  if (!options.ok) {
    return { form: false, node: denied(options.code) ? <AccessDeniedState body={assignmentWriteText(options.code ?? "")} />
      : <ErrorState title="Couldn't load the assign form" body="The custodian options could not be loaded. Check your connection and retry." onRetry={flow.options.reload} /> };
  }
  const withPanel = (node: ReactNode) => (
    <div className="grid min-w-0 items-start gap-3 @min-4xl/assign-flow:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
      {node}
      <AssignSidePanel flow={flow} />
    </div>
  );
  if (flow.name === "Select Asset") return { node: withPanel(<AssignSelectAsset context={context} flow={flow} />), form: true };
  const detail = flow.detail.result;
  if (!detail) return { node: <AssignFlowBodyLoading />, form: false };
  if (!detail.ok) {
    const node = detail.code === "NOT_FOUND" ? <NotFoundState title="Asset not found" body={detail.message} />
      : denied(detail.code) ? <AccessDeniedState body={detail.message} />
        : <ErrorState title="Couldn't load this asset" body={detail.message} onRetry={flow.detail.reload} />;
    return { node, form: false };
  }
  const block = assetAssignBlock(detail.data);
  if (block) {
    const text = assignBlockText(block);
    const id = encodeURIComponent(detail.data.id);
    const action = (
      <Button
        asChild
        variant="outline"
        size="sm"
      >
        <Link href={block === "has_custody" ? `/asset-workspace/assets/${id}/transfer${routeAssetId ? "" : "?from=assignments"}` : `/asset-workspace/assets/${id}`}>
          {block === "has_custody" ? "Transfer" : "View Asset"}
        </Link>
      </Button>
    );
    return { node: <EmptyState title={text.title} body={text.body} action={action} />, form: false };
  }
  const main = flow.name === "Review" ? <AssignReview flow={flow} asset={detail.data} />
    : <AssignDetailsForm context={context} flow={flow} asset={detail.data} rules={options.data} />;
  return { node: withPanel(main), form: true };
}
