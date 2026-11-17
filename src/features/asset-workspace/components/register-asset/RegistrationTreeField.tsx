import { Skeleton } from "@/components/ui/Skeleton";
import { treeReference, type ReferenceTreeKind } from "../../domain/registration-reference-tree";
import { useReferenceTree } from "../../hooks/use-reference-tree";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import type { ReferenceItem } from "../../services/registration-selector-contract";
import { RegistrationReferenceSelect } from "./RegistrationReferenceSelect";
import { RegistrationTreeSelect, type TreeSelectCopy } from "./RegistrationTreeSelect";

const COPY: Record<ReferenceTreeKind, TreeSelectCopy> = {
  categories: { one: "category", many: "categories", children: "Subcategories", adminPage: "Categories" },
  locations: { one: "location", many: "locations", children: "Locations inside", adminPage: "Locations" },
  orgUnits: { one: "organizational unit", many: "organizational units", children: "Units inside" },
};

/** Tree dropdown when the whole list can be read; otherwise the registration options select (one level at a time). */
export function RegistrationTreeField({ kind, name, label, value, selectedLabel, required = true, context, rules, error, onChange }: {
  kind: ReferenceTreeKind; name: string; label: string; value: string; selectedLabel: string; required?: boolean;
  context: string; rules: RegistrationOptions["referenceSelectors"]; error?: string; onChange: (item: ReferenceItem) => void;
}) {
  const tree = useReferenceTree(context, kind);
  const hint = kind === "orgUnits" ? "Department, division, section or branch" : undefined;
  if (tree === null) {
    return (
      <div role="status" aria-label={`Loading ${COPY[kind].many}`} className="space-y-1 motion-reduce:[&_*]:animate-none">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }
  if (tree === "failed") {
    // shortcut: the fallback select always marks itself required; give it a required prop if an optional field needs it.
    return (
      <RegistrationReferenceSelect name={name} label={label} value={value} kind={kind} selectedLabel={selectedLabel}
        context={context} rules={rules} error={error} hint={hint} onChange={onChange} />
    );
  }
  return (
    <RegistrationTreeSelect name={name} label={label} kind={kind} copy={COPY[kind]} tree={tree} value={value} selectedLabel={selectedLabel}
      required={required} error={error} hint={hint}
      maxLength={rules.search.maxLength} onChange={(node) => onChange(treeReference(tree, node, kind))} />
  );
}
