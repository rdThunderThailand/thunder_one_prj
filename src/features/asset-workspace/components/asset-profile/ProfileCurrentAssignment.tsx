import { Card } from "@/components/ui/Card";
import { assignmentHistoryReason } from "../../domain/assignment-history";
import { locationTrail } from "../../domain/asset-profile";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { ProfileCustodyActions } from "./ProfileControls";
import { formatDay, ProfileRows, ProfileSection } from "./ProfileParts";
import { CustodianValue } from "./ProfileValues";

export function ProfileCurrentAssignment({ asset, tinted = false }: { asset: AssetDetail; tinted?: boolean }) {
  const date = formatDay(asset.custody?.since ?? null);
  const location = locationTrail(asset.locationPath, asset.location) || "—";
  const note = assignmentHistoryReason(asset.custody?.note ?? null);
  if (tinted) {
    return (
      <Card role="region" aria-label="Current Assignment"
        className="@container/current-assignment min-w-0 space-y-3 bg-accent/50! p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
        <h2 className="text-sm font-semibold">Current Assignment</h2>
        <div className="grid min-w-0 gap-4 @lg/current-assignment:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] @4xl/current-assignment:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto]">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Custodian</p>
            <CustodianValue custody={asset.custody} />
          </div>
          <dl className="grid min-w-0 gap-3 text-xs @sm/current-assignment:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="space-y-1">
              <dt className="text-muted-foreground">Assigned Date</dt>
              <dd>{date}</dd>
            </div>
            <div className="min-w-0 space-y-1">
              <dt className="text-muted-foreground">Location</dt>
              <dd className="wrap-anywhere">{location}</dd>
              <dt className="text-muted-foreground">Notes</dt>
              <dd className="whitespace-pre-wrap wrap-anywhere">{note}</dd>
            </div>
          </dl>
          <ProfileCustodyActions asset={asset} placement="assignment" />
        </div>
      </Card>
    );
  }
  return (
    <ProfileSection title="Current Assignment">
      <div className="grid min-w-0 items-start gap-3 @min-xl/profile-section:grid-cols-2">
        <CustodianValue custody={asset.custody} />
        <ProfileRows rows={[
          { label: "Assigned Date", value: date },
          { label: "Location", value: location },
          { label: "Notes", value: note },
        ]} />
      </div>
    </ProfileSection>
  );
}
