"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
import { UserIcon, UsersIcon } from "@/components/ui/icons";
import type { AssignTarget } from "../../domain/assignment-assign";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { referenceLabel, type ReferenceItem } from "../../services/registration-selector-contract";
import { RegistrationReferenceSelect } from "../register-asset/RegistrationReferenceSelect";
import { RegistrationTreeField } from "../register-asset/RegistrationTreeField";

const tabs = [
  { value: "person", label: "Person", icon: UserIcon },
  { value: "org_unit", label: "Organizational unit", icon: UsersIcon },
] as const;

function toTarget(type: AssignTarget["type"], item: ReferenceItem): AssignTarget {
  return { type, id: item.id, name: item.name?.trim() || "Unnamed custodian", secondary: type === "person" ? item.secondary_label || null : null };
}

function labelFor(target: AssignTarget) {
  return referenceLabel({ id: target.id, name: target.name, secondary_label: target.secondary ?? undefined },
    target.type === "person" ? "persons" : "orgUnits");
}

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
            className="min-h-10 min-w-0 flex-1 gap-2 whitespace-normal rounded-none border-b-2 border-transparent px-3 py-1 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-accent-foreground data-[state=active]:shadow-none motion-reduce:transition-none"
          >
            <Icon
              aria-hidden="true"
              className="size-4 shrink-0"
            />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map(({ value, label }) => {
        const selected = target?.type === value ? target : null;
        const field = {
          name: `${prefix}-${value}`, label, value: selected?.id ?? "", selectedLabel: selected ? labelFor(selected) : "",
          context, rules, error: selected ? error : undefined,
          onChange: (item: ReferenceItem) => onTarget(toTarget(value, item)),
        };
        return (
          <TabsContent key={value} value={value} className="pt-2">
            {value === "person" ? (
              <RegistrationReferenceSelect {...field} kind="persons" />
            ) : (
              <RegistrationTreeField {...field} kind="orgUnits" />
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
