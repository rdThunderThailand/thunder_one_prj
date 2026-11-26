import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, BuildingIcon, CalendarIcon, FileIcon, FileTextIcon, SettingsIcon, UserIcon } from "@/components/ui/icons";
import type { AssetCondition } from "../../domain/asset-condition";
import { locationTrail } from "../../domain/asset-profile";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { ConditionBadge } from "../StatusBadges";
import { AssignAssetCard } from "./AssignAssetCard";
import { AssignHolder } from "./AssignHolder";
import { SaveAlert } from "./SaveAlert";
import { PartyBox, ReviewFields, ReviewSection, SectionTitle } from "./SectionTitle";
import type { TransferFlow } from "./use-transfer-flow";

/** Read-only check before saving (PO frame 20). The footer's "Confirm Transfer" saves. */
export function TransferReview({ flow, asset }: { flow: TransferFlow; asset: AssetDetail }) {
  const current = locationTrail(asset.locationPath, asset.location) || "No location";
  const next = flow.location && flow.location.id !== asset.location?.id ? flow.location.name : current;
  const files = flow.evidence.items.map((item) => item.file.name).join(", ") || "None";
  return (
    <Card className="space-y-3 p-4">
      <SectionTitle
        icon={FileTextIcon}
        subtitle="Please review all information below and confirm to complete the transfer."
      >
        Confirm Transfer
      </SectionTitle>
      <SaveAlert
        save={flow.save}
        action="transfer"
        reloading={flow.detail.pending}
        onReload={flow.reload}
      />
      <AssignAssetCard
        asset={asset}
        thumbnailUrl={flow.photo}
        columns={["serial", "tag", "status", "condition"]}
        reviewTitle="Asset Information"
      />
      <div className="flex min-w-0 flex-col items-stretch gap-3 @min-2xl/assign-flow:flex-row">
        <PartyBox
          icon={UserIcon}
          title="From (Current)"
          accent
          location={current}
          since={asset.custody?.since}
          holder={asset.custody ? (
            <AssignHolder
              type={asset.custody.type}
              name={asset.custody.name}
              secondary={asset.custody.department?.name}
              avatarUrl={asset.custody.avatarUrl}
            />
          ) : (
            <p className="text-xs text-muted-foreground">No current custodian</p>
          )}
        />
        <ArrowRightIcon
          aria-hidden="true"
          className="mx-auto size-4 shrink-0 rotate-90 self-center text-accent-foreground @min-2xl/assign-flow:rotate-0"
        />
        <PartyBox
          icon={BuildingIcon}
          title="To (New)"
          accent
          location={next ?? current}
          holder={flow.target && (
            <AssignHolder
              type={flow.target.type}
              name={flow.target.name}
              secondary={flow.target.secondary}
            />
          )}
        />
      </div>
      <ReviewSection
        icon={CalendarIcon}
        title="Transfer Details"
      >
        <ReviewFields fields={[{ label: "Reason / Note", value: flow.reason.trim() || "—" }]} />
      </ReviewSection>
      <ReviewSection
        icon={SettingsIcon}
        title="Condition at Time of Transfer"
      >
        <div className="pl-6">
          <ConditionBadge condition={flow.condition as AssetCondition | null} />
        </div>
      </ReviewSection>
      <ReviewSection
        icon={FileIcon}
        title="Attachments"
      >
        <ReviewFields fields={[{ label: "Files", value: files }]} />
      </ReviewSection>
    </Card>
  );
}
