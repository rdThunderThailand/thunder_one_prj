"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ClockIcon, LocationIcon, SettingsIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { ASSET_CONDITIONS, type AssetCondition } from "../../domain/asset-condition";
import { locationTrail } from "../../domain/asset-profile";
import { conditionBlocksTransfer } from "../../domain/assignment-transfer";
import type { AssetDetail } from "../../services/asset-profile-contract";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { referenceLabel } from "../../services/registration-selector-contract";
import { RegistrationReferenceSelect } from "../register-asset/RegistrationReferenceSelect";
import { ConditionBadge } from "../StatusBadges";
import { AssignAssetCard } from "./AssignAssetCard";
import { AssignAttachments } from "./AssignAttachments";
import { CustodianTabs } from "./CustodianTabs";
import { ReasonField } from "./ReasonField";
import { SectionTitle } from "./SectionTitle";
import type { TransferFlow } from "./use-transfer-flow";

export function TransferDetailsForm({ context, flow, asset, rules, returnHref }: {
  context: string; flow: TransferFlow; asset: AssetDetail; rules: RegistrationOptions; returnHref: string;
}) {
  const blocked = conditionBlocksTransfer(flow.condition);
  return (
    <div className="min-w-0 space-y-3">
      <AssignAssetCard
        asset={asset}
        thumbnailUrl={flow.photo}
      />
      <Card className="space-y-3 p-4">
        <SectionTitle icon={ClockIcon}>1. New Custodian</SectionTitle>
        <CustodianTabs
          context={context}
          rules={rules.referenceSelectors}
          prefix="transfer"
          tab={flow.tab}
          onTab={flow.chooseTab}
          target={flow.target}
          onTarget={flow.setTarget}
          error={flow.sameHolder ? "Already the current holder" : undefined}
        />
      </Card>
      <Card className="space-y-3 p-4">
        <SectionTitle icon={ClockIcon}>2. Transfer Details</SectionTitle>
        <div className="grid min-w-0 gap-3 @min-2xl/assign-flow:grid-cols-2">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-foreground">From Location (Current)</p>
            <p className="flex min-h-10 items-center gap-2 rounded-control border border-border bg-muted px-3 text-xs text-muted-foreground wrap-anywhere">
              <LocationIcon
                aria-hidden="true"
                className="size-4 shrink-0"
              />
              {locationTrail(asset.locationPath, asset.location) || "No location"}
            </p>
          </div>
          <div className="min-w-0 space-y-1">
            <RegistrationReferenceSelect
              name="transfer-location"
              label="To Location"
              value={flow.location?.id ?? ""}
              selectedLabel={flow.location ? referenceLabel({ id: flow.location.id, name: flow.location.name }, "locations") : ""}
              kind="locations"
              context={context}
              rules={rules.referenceSelectors}
              onChange={(item) => flow.setLocation({ id: item.id, name: item.name?.trim() || "Unnamed location" })}
            />
            {/* shortcut: the shared picker always marks itself required; this hint says otherwise until it takes an optional prop */}
            {!flow.location && <p className="text-2xs text-muted-foreground">Optional. Leave empty to keep the current location.</p>}
            {flow.location && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-2xs"
                onClick={() => flow.setLocation(null)}
              >
                Keep the current location
              </Button>
            )}
          </div>
        </div>
        <ReasonField
          id="transfer-reason"
          value={flow.reason}
          onChange={flow.setReason}
          placeholder="For example: Moving to the Sales team"
        />
      </Card>
      <Card className="space-y-3 p-4">
        <SectionTitle
          icon={SettingsIcon}
          subtitle="Confirm asset condition at the time of transfer."
        >
          3. Condition Check
        </SectionTitle>
        <div className="max-w-xs space-y-1">
          <label
            id="transfer-condition-label"
            className="text-xs font-medium text-foreground"
          >
            Condition
            <span
              aria-hidden="true"
              className="text-error"
            >
              {" "}*
            </span>
          </label>
          <Select
            value={flow.condition ?? undefined}
            onValueChange={flow.setCondition}
          >
            <SelectTrigger
              aria-labelledby="transfer-condition-label"
              aria-required="true"
              className="min-h-10 text-xs"
            >
              <SelectValue placeholder="Choose condition" />
            </SelectTrigger>
            <SelectContent>
              {ASSET_CONDITIONS.map((value) => (
                <SelectItem
                  key={value}
                  value={value}
                >
                  <ConditionBadge condition={value as AssetCondition} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {blocked && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-control bg-warning-muted p-3 text-xs text-foreground"
          >
            <WarningTriangleIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-warning"
            />
            <p className="min-w-0 flex-1">Damaged or Unusable assets are returned, not transferred.</p>
            <Button
              asChild
              variant="outline"
              size="sm"
            >
              <Link href={returnHref}>Return instead</Link>
            </Button>
          </div>
        )}
        <AssignAttachments evidence={flow.evidence} />
      </Card>
    </div>
  );
}
