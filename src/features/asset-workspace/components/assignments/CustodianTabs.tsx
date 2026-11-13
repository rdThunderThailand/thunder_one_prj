"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
import { UserIcon, UsersIcon } from "@/components/ui/icons";
import type { AssignTarget } from "../../domain/assignment-assign";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { referenceLabel, type ReferenceItem } from "../../services/registration-selector-contract";
import { RegistrationReferenceSelect } from "../register-asset/RegistrationReferenceSelect";

const tabs = [
  { value: "person", label: "Person", icon: UserIcon, kind: "persons", picker: "Person" },
  { value: "org_unit", label: "Team", icon: UsersIcon, kind: "orgUnits", picker: "Team" },
] as const;

function toTarget(type: AssignTarget["type"], item: ReferenceItem): AssignTarget {
  return { type, id: item.id, name: item.name?.trim() || "Unnamed custodian", secondary: type === "person" ? item.secondary_label || null : null };
}

function labelFor(target: AssignTarget) {
  return referenceLabel({ id: target.id, name: target.name, secondary_label: target.secondary ?? undefined },
    target.type === "person" ? "persons" : "orgUnits");
}

/** Person / Team tabs for FE 02–03, each one shared `RegistrationReferenceSelect`, unchanged. */
export function CustodianTabs({ context, rules, prefix, tab, onTab, target, onTarget, error }: {
  context: string; rules: RegistrationOptions["referenceSelectors"]; prefix: string; tab: AssignTarget["type"];
  onTab: (tab: AssignTarget["type"]) => void; target: AssignTarget | null; onTarget: (target: AssignTarget) => void; error?: string;
}) {
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => onTab(value as AssignTarget["type"])}
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
            name={`${prefix}-${value}`}
            label={picker}
            value={target?.type === value ? target.id : ""}
            selectedLabel={target?.type === value ? labelFor(target) : ""}
            kind={kind}
            context={context}
            rules={rules}
            error={target?.type === value ? error : undefined}
            onChange={(item) => onTarget(toTarget(value, item))}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
