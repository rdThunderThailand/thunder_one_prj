"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/lovable/button";
import { locationTrail } from "../../domain/asset-profile";
import { useAssetEdit } from "../../hooks/use-asset-edit";
import { useAssetEditLeave } from "../../hooks/use-asset-edit-leave";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { getAssetEditOptions } from "../../services/asset-edit-options";
import type { AssetDetail } from "../../services/asset-profile-contract";
import type { ReferenceItem } from "../../services/registration-selector-contract";
import { ErrorState } from "../states/ErrorState";
import { AccessDeniedState } from "../states/states";
import { ConditionValue, ProfileRows, ProfileSection, StatusValue } from "../asset-profile/ProfileParts";
import { CustodianValue } from "../asset-profile/ProfileValues";
import { AssetEditFields } from "./AssetEditFields";
import { AssetEditHeader } from "./AssetEditHeader";
import { AssetEditFormLoading } from "./AssetEditLoading";
import { AssetEditDuplicate, AssetEditFeedback } from "./AssetEditFeedback";

export function EditAssetForm({ context, asset }: { context: string; asset: AssetDetail }) {
  const flow = useAssetEdit(context, asset);
  const refs = useProfileRead(`${context}:${asset.id}:${flow.asset.updatedAt}:edit-options`, (signal) => getAssetEditOptions(context, flow.asset, signal));
  const [selected, setSelected] = useState<ReferenceItem | null>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const href = `/asset-workspace/assets/${encodeURIComponent(asset.id)}`;
  useAssetEditLeave(flow.dirty, flow.phase === "sending", flow.phase === "uncertain", flow.phase === "success");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (refs.pending || !refs.result?.ok) return;
    const saved = await flow.submit();
    if (saved) {
      toast.success("Asset updated");
      router.push(href);
      router.refresh();
    } else requestAnimationFrame(() => feedback.current?.focus());
  }
  return (
    <>
      <AssetEditHeader assetId={asset.id} name={flow.asset.name} />
      {!refs.result ? <AssetEditFormLoading /> : !refs.result.ok ? (
        <div data-asset-edit-body className="min-h-0 overflow-y-auto p-1 group-data-[bounded=true]/asset-edit-workspace:flex-1">
          {refs.result.code === "PERMISSION_DENIED" || refs.result.code === "UNAUTHENTICATED"
            ? <AccessDeniedState body={refs.result.message} />
            : <ErrorState title="Couldn't load category options" body={refs.result.message} onRetry={refs.reload} />}
        </div>
      ) : (
        <form noValidate onSubmit={submit} data-asset-edit-body aria-label="Edit asset" aria-busy={flow.phase === "sending" || flow.reloading}
          className="flex min-w-0 flex-col gap-3 group-data-[bounded=true]/asset-edit-workspace:min-h-0 group-data-[bounded=true]/asset-edit-workspace:flex-1 group-data-[bounded=true]/asset-edit-workspace:shrink">
          <div className="min-w-0 space-y-3 p-1 group-data-[bounded=true]/asset-edit-workspace:min-h-0 group-data-[bounded=true]/asset-edit-workspace:flex-1 group-data-[bounded=true]/asset-edit-workspace:overflow-y-auto">
            <AssetEditFeedback flow={flow} feedback={feedback} />
            {flow.reloading && <p role="status" className="rounded-control bg-muted p-3 text-xs">Reloading asset… Your input remains until the latest details load.</p>}
            <div className="grid min-w-0 items-start gap-3 @min-4xl/asset-edit-workspace:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
              <div className="min-w-0 space-y-3">
                <AssetEditFields context={context} flow={flow} options={refs.result.data} selected={selected} onSelect={(item) => { setSelected(item); flow.patch({ categoryId: item.id }); }} />
                <AssetEditDuplicate flow={flow} />
              </div>
              <ProfileSection title="Current details">
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">Changed through their own actions. Description is view-only.</p>
                <ProfileRows rows={[
                  { label: "Asset Tag", value: flow.asset.assetTag },
                  { label: "Description", value: flow.asset.description || "—" },
                  { label: "Location", value: locationTrail(flow.asset.locationPath, flow.asset.location) || "—" },
                  { label: "Status", value: <StatusValue status={flow.asset.lifecycleStatus} /> },
                  { label: "Condition", value: <ConditionValue condition={flow.asset.condition} /> },
                  { label: "Custodian", value: <CustodianValue custody={flow.asset.custody} /> },
                ]} />
              </ProfileSection>
            </div>
          </div>
          <footer data-asset-edit-footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-background pt-3">
            <Button asChild variant="outline" size="sm" className="max-sm:h-10">
              <Link href={href}>Cancel</Link>
            </Button>
            <Button type="submit" size="sm" className="max-sm:h-10" disabled={!flow.canSave || refs.pending}>
              {flow.phase === "sending" ? "Saving…" : flow.phase === "success" ? "Saved" : "Save Changes"}
            </Button>
          </footer>
        </form>
      )}
    </>
  );
}
