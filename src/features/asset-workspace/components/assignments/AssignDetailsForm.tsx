"use client";

import { Card } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
import { Textarea } from "@/components/ui/lovable/textarea";
import { UserIcon, UsersIcon } from "@/components/ui/icons";
import { ASSIGN_REASON_MAX, type AssignTarget } from "../../domain/assignment-assign";
import type { AssetDetail } from "../../services/asset-profile-contract";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { referenceLabel, type ReferenceItem } from "../../services/registration-selector-contract";
import { RegistrationReferenceSelect } from "../register-asset/RegistrationReferenceSelect";
import { AssignAssetCard } from "./AssignAssetCard";
import { AssignAttachments } from "./AssignAttachments";
import type { AssignFlow } from "./use-assign-flow";

const tabs = [
  { value: "person", label: "Person", icon: UserIcon, kind: "persons", picker: "Person" },
  { value: "org_unit", label: "Team", icon: UsersIcon, kind: "orgUnits", picker: "Team" },
] as const;

function toTarget(type: AssignTarget["type"], item: ReferenceItem): AssignTarget {
  return { type, id: item.id, name: item.name?.trim() || "Unnamed custodian", secondary: type === "person" ? item.secondary_label || null : null };
}

export function AssignDetailsForm({ context, flow, asset, rules }: {
  context: string; flow: AssignFlow; asset: AssetDetail; rules: RegistrationOptions;
}) {
  const number = flow.steps.length === 4 ? 2 : 1;
  return (
    <div className="min-w-0 space-y-3">
      <AssignAssetCard
        asset={asset}
        thumbnailUrl={flow.picked?.thumbnailUrl ?? null}
      />
      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold text-foreground">{number}. Assign To</h2>
        <Tabs
          value={flow.tab}
          onValueChange={(value) => flow.chooseTab(value as AssignTarget["type"])}
        >
          <TabsList
            aria-label="Custodian type"
            className="flex h-auto min-h-10 w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0"
          >
            {tabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="min-h-10 flex-1 gap-2 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-accent-foreground data-[state=active]:shadow-none motion-reduce:transition-none"
              >
                <Icon
                  aria-hidden="true"
                  className="size-4"
                />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map(({ value, kind, picker }) => (
            <TabsContent
              key={value}
              value={value}
              className="pt-2"
            >
              <RegistrationReferenceSelect
                name={`assign-${value}`}
                label={picker}
                value={flow.target?.type === value ? flow.target.id : ""}
                selectedLabel={flow.target?.type === value ? referenceLabelFor(flow.target) : ""}
                kind={kind}
                context={context}
                rules={rules.referenceSelectors}
                onChange={(item) => flow.setTarget(toTarget(value, item))}
              />
            </TabsContent>
          ))}
        </Tabs>
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold text-foreground">{number + 1}. Assignment Details</h2>
        <div className="space-y-1">
          <label
            htmlFor="assign-reason"
            className="text-xs font-medium text-foreground"
          >
            Reason / Note (optional)
          </label>
          <Textarea
            id="assign-reason"
            rows={3}
            maxLength={ASSIGN_REASON_MAX}
            placeholder="For example: New starter in Sales"
            value={flow.reason}
            onChange={(event) => flow.setReason(event.target.value)}
            aria-describedby="assign-reason-count"
          />
          <p
            id="assign-reason-count"
            className="text-right text-2xs text-muted-foreground"
          >
            {flow.reason.length}/{ASSIGN_REASON_MAX}
          </p>
        </div>
        <AssignAttachments evidence={flow.evidence} />
      </Card>
    </div>
  );
}

function referenceLabelFor(target: AssignTarget) {
  return referenceLabel({ id: target.id, name: target.name, secondary_label: target.secondary ?? undefined },
    target.type === "person" ? "persons" : "orgUnits");
}
