"use client";

import { Card } from "@/components/ui/Card";
import { CalendarIcon, SettingsIcon } from "@/components/ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { ASSET_CONDITIONS } from "../../domain/asset-condition";
import { returnCondition, statusAfterReturn } from "../../domain/assignment-return";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { ConditionBadge, StatusBadge } from "../StatusBadges";
import { AssignAssetCard } from "./AssignAssetCard";
import { AssignAttachments } from "./AssignAttachments";
import { ReasonField } from "./ReasonField";
import { SaveAlert } from "./SaveAlert";
import { SectionTitle } from "./SectionTitle";
import type { ReturnFlow } from "./use-return-flow";

export function ReturnDetailsForm({ flow, asset }: { flow: ReturnFlow; asset: AssetDetail }) {
  return (
    <div className="min-w-0 space-y-3">
      <AssignAssetCard asset={asset} thumbnailUrl={flow.photo} />
      <Card className="space-y-3 p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
        <SectionTitle icon={CalendarIcon}>1. Return Details</SectionTitle>
        <SaveAlert save={flow.save} action="return" reloading={flow.detail.pending} onReload={flow.reload} />
        <ReasonField id="return-reason" value={flow.reason} onChange={flow.setReason} placeholder="For example: No longer needed" />
        {flow.reason.length > 500 && <p role="alert" className="text-xs text-error">Use 500 characters or fewer.</p>}
      </Card>
      <Card className="space-y-3 p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
        <SectionTitle
          icon={SettingsIcon}
          subtitle="Confirm asset condition at the time of return."
        >
          2. Condition Check
        </SectionTitle>
        <div className="grid gap-3 @min-2xl/assign-flow:grid-cols-2">
          <div className="space-y-1">
            <label id="return-condition-label" className="text-xs font-medium text-foreground">
              Condition <span aria-hidden="true" className="text-error">*</span>
            </label>
            <Select value={flow.condition ?? undefined} onValueChange={(value) => flow.setCondition(returnCondition(value))}>
              <SelectTrigger aria-labelledby="return-condition-label" aria-describedby="return-condition-help" aria-required="true" className="min-h-10 text-xs">
                <SelectValue placeholder="Choose condition" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_CONDITIONS.map((condition) => (
                  <SelectItem key={condition} value={condition}>
                    <ConditionBadge condition={condition} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p id="return-condition-help" className="text-2xs text-muted-foreground">
              {flow.condition ? "No service request is created." : "Choose a condition to continue."}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Next status</p>
            {flow.condition ? <StatusBadge status={statusAfterReturn(flow.condition)} /> : (
              <p className="text-xs text-muted-foreground">Choose a condition to see the next status</p>
            )}
          </div>
        </div>
      </Card>
      <Card className="p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
        <AssignAttachments evidence={flow.evidence} />
      </Card>
    </div>
  );
}
