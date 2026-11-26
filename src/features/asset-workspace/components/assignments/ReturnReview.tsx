import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, BuildingIcon, CalendarIcon, FileIcon, FileTextIcon, SettingsIcon, UserIcon } from "@/components/ui/icons";
import { locationTrail } from "../../domain/asset-profile";
import { statusAfterReturn } from "../../domain/assignment-return";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { ConditionBadge, StatusBadge } from "../StatusBadges";
import { AssignAssetCard } from "./AssignAssetCard";
import { AssignHolder } from "./AssignHolder";
import { AssignResult } from "./AssignResult";
import { SaveAlert } from "./SaveAlert";
import { PartyBox, ReviewFields, ReviewSection, SectionTitle } from "./SectionTitle";
import type { ReturnFlow } from "./use-return-flow";

/** Return-owned record details also remain visible on the post-save result. */
function ReturnRecord({ flow, location }: { flow: ReturnFlow; location: string }) {
  return (
    <dl className="divide-y divide-border text-xs">
      <div className="grid gap-1 py-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <dt className="text-muted-foreground">Condition at Time of Return</dt>
        <dd>
          <ConditionBadge condition={flow.condition} />
        </dd>
      </div>
      <div className="grid gap-1 py-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <dt className="text-muted-foreground">Next status</dt>
        <dd>
          {flow.condition && <StatusBadge status={statusAfterReturn(flow.condition)} />}
        </dd>
      </div>
      {[{ label: "Location", value: `Stays ${location}` }, { label: "Reason / Note", value: flow.reason.trim() || "—" },
        { label: "Attachments", value: flow.evidence.items.map((item) => item.file.name).join(", ") || "None" }].map((row) => (
        <div key={row.label} className="grid gap-1 py-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="text-foreground wrap-anywhere">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ReturnReview({ flow, asset }: { flow: ReturnFlow; asset: AssetDetail }) {
  const location = locationTrail(asset.locationPath, asset.location) || "No location";
  const files = flow.evidence.items.map((item) => item.file.name).join(", ") || "None";
  return (
    <Card className="space-y-3 p-4">
      <SectionTitle
        icon={FileTextIcon}
        subtitle="Please review the return information before confirming."
      >
        Review &amp; Confirm
      </SectionTitle>
      <SaveAlert
        save={flow.save}
        action="return"
        reloading={flow.detail.pending}
        onReload={flow.reload}
      />
      <AssignAssetCard
        asset={asset}
        thumbnailUrl={flow.photo}
        columns={["serial", "tag", "custodian", "status"]}
        reviewTitle="1. Asset Information"
      />
      <div className="flex min-w-0 flex-col items-stretch gap-3 @min-2xl/assign-flow:flex-row">
        <PartyBox
          icon={UserIcon}
          title="2. From (Current)"
          location={location}
          since={asset.custody?.since}
          holder={asset.custody && (
            <AssignHolder
              type={asset.custody.type}
              name={asset.custody.name}
              secondary={asset.custody.department?.name}
              avatarUrl={asset.custody.avatarUrl}
            />
          )}
        />
        <ArrowRightIcon
          aria-hidden="true"
          className="mx-auto size-4 shrink-0 rotate-90 self-center text-accent-foreground @min-2xl/assign-flow:rotate-0"
        />
        <PartyBox
          icon={BuildingIcon}
          title="3. To (Return)"
          location={location}
          holder={<p className="text-xs font-semibold text-foreground">Unassigned</p>}
        />
      </div>
      <ReviewSection
        icon={CalendarIcon}
        title="4. Return Details"
      >
        <ReviewFields fields={[{ label: "Reason / Note", value: flow.reason.trim() || "—" }]} />
      </ReviewSection>
      <ReviewSection
        icon={SettingsIcon}
        title="5. Condition Check"
      >
        <ReviewFields fields={[{ label: "Condition", value: <ConditionBadge condition={flow.condition} /> }]} />
      </ReviewSection>
      <ReviewSection
        icon={FileIcon}
        title="6. Attachments"
      >
        <ReviewFields fields={[{ label: "Files", value: files }]} />
      </ReviewSection>
    </Card>
  );
}

export function ReturnResult({ flow }: { flow: ReturnFlow }) {
  if (!flow.saved) return null;
  const { before, after } = flow.saved;
  return (
    <div className="min-w-0 space-y-3">
      <AssignResult before={before} after={after} title="Asset returned" />
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-foreground">Return Details</h2>
        <ReturnRecord flow={flow} location={locationTrail(after.locationPath, after.location) || "No location"} />
      </Card>
    </div>
  );
}
