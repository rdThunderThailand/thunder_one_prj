import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { assignmentHistoryReason } from "../../domain/assignment-history";
import { locationTrail } from "../../domain/asset-profile";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { ProfileCustodyActions } from "./ProfileControls";
import { formatDay, ProfileRows, ProfileSection } from "./ProfileParts";

export function ProfileCurrentAssignment({ asset, tinted = false }: { asset: AssetDetail; tinted?: boolean }) {
  const date = formatDay(asset.custody?.since ?? null);
  const location = locationTrail(asset.locationPath, asset.location) || "—";
  const note = assignmentHistoryReason(asset.custody?.note ?? null);
  const custody = asset.custody;
  if (tinted) {
    // Frame 04: avatar beside a label / name / department stack, the facts grouped next to it, actions on the right.
    return (
      <Card role="region" aria-label="Current Assignment"
        className="@container/current-assignment min-w-0 space-y-3 bg-accent/50! p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
        <h2 className="text-sm font-semibold">Current Assignment</h2>
        <div className="grid min-w-0 items-start gap-x-8 gap-y-4 @lg/current-assignment:grid-cols-2 @4xl/current-assignment:grid-cols-[minmax(0,15rem)_minmax(0,8rem)_minmax(0,1fr)_auto]">
          <div className="flex min-w-0 items-center gap-3">
            {custody && <Avatar name={custody.name || "?"} src={custody.avatarUrl} size={40} />}
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs text-muted-foreground">Current Custodian</p>
              {custody ? (
                <p className="text-sm font-semibold wrap-anywhere text-foreground">{custody.name || "Unnamed custodian"}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Unassigned</p>
              )}
              {custody?.department && <p className="text-xs wrap-anywhere text-muted-foreground">{custody.department.name}</p>}
            </div>
          </div>
          <dl className="min-w-0 space-y-1 text-xs">
            <dt className="text-muted-foreground">Assigned Date</dt>
            <dd className="text-foreground">{date}</dd>
          </dl>
          <dl className="min-w-0 space-y-1 text-xs">
            <dt className="text-muted-foreground">Location</dt>
            <dd className="wrap-anywhere text-foreground">{location}</dd>
            <dt className="pt-1 text-muted-foreground">Notes</dt>
            <dd className="whitespace-pre-wrap wrap-anywhere text-foreground">{note}</dd>
          </dl>
          <div className="min-w-0 @4xl/current-assignment:self-center @4xl/current-assignment:justify-self-end">
            <ProfileCustodyActions asset={asset} placement="assignment" />
          </div>
        </div>
      </Card>
    );
  }
  return (
    <ProfileSection title="Current Assignment">
      <div className="grid min-w-0 items-center gap-4 @min-xl/profile-section:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <div className="flex min-w-0 items-center gap-3">
          {custody && <Avatar name={custody.name || "?"} src={custody.avatarUrl} size={40} />}
          <div className="min-w-0 space-y-0.5">
            {custody ? (
              <p className="text-sm font-semibold wrap-anywhere text-foreground">{custody.name || "Unnamed custodian"}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Unassigned</p>
            )}
            {custody?.department && <p className="text-xs wrap-anywhere text-muted-foreground">{custody.department.name}</p>}
          </div>
        </div>
        <ProfileRows rows={[
          { label: "Assigned Date", value: date },
          { label: "Location", value: location },
          { label: "Notes", value: note },
        ]} />
      </div>
    </ProfileSection>
  );
}
