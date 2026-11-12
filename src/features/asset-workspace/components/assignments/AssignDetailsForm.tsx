"use client";

import { Card } from "@/components/ui/Card";
import { ClockIcon } from "@/components/ui/icons";
import type { AssetDetail } from "../../services/asset-profile-contract";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { AssignAssetCard } from "./AssignAssetCard";
import { SectionTitle } from "./SectionTitle";
import { AssignAttachments } from "./AssignAttachments";
import { CustodianTabs } from "./CustodianTabs";
import { ReasonField } from "./ReasonField";
import type { AssignFlow } from "./use-assign-flow";

export function AssignDetailsForm({ context, flow, asset, rules }: {
  context: string; flow: AssignFlow; asset: AssetDetail; rules: RegistrationOptions;
}) {
  const number = flow.steps.length === 4 ? 2 : 1;
  return (
    <div className="min-w-0 space-y-3">
      <AssignAssetCard
        asset={asset}
        thumbnailUrl={flow.picked?.thumbnailUrl ?? flow.photo}
      />
      <Card className="space-y-3 p-4">
        <SectionTitle icon={ClockIcon}>{number}. Assign To</SectionTitle>
        <CustodianTabs
          context={context}
          rules={rules.referenceSelectors}
          prefix="assign"
          tab={flow.tab}
          onTab={flow.chooseTab}
          target={flow.target}
          onTarget={flow.setTarget}
        />
      </Card>
      <Card className="space-y-3 p-4">
        <SectionTitle icon={ClockIcon}>{number + 1}. Assignment Details</SectionTitle>
        <ReasonField
          id="assign-reason"
          value={flow.reason}
          onChange={flow.setReason}
          placeholder="For example: New starter in Sales"
        />
        <AssignAttachments evidence={flow.evidence} />
      </Card>
    </div>
  );
}
