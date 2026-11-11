import { Skeleton } from "@/components/ui/Skeleton";
import { treeReference } from "../../domain/registration-reference-tree";
import { useReferenceTree } from "../../hooks/use-reference-tree";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import type { ReferenceItem } from "../../services/registration-selector-contract";
import { RegistrationReferenceSelect } from "./RegistrationReferenceSelect";
import { RegistrationTreeSelect, type TreeSelectCopy } from "./RegistrationTreeSelect";

const COPY: Record<"categories" | "locations", TreeSelectCopy> = {
  categories: { one: "category", many: "categories", children: "Subcategories", adminPage: "Categories" },
  locations: { one: "location", many: "locations", children: "Locations inside", adminPage: "Locations" },
};

/** Tree dropdown when the whole list can be read; otherwise the registration options select (one level at a time). */
export function RegistrationTreeField({ kind, name, label, value, selectedLabel, context, rules, error, onChange }: {
  kind: "categories" | "locations"; name: string; label: string; value: string; selectedLabel: string; context: string;
  rules: RegistrationOptions["referenceSelectors"]; error?: string; onChange: (item: ReferenceItem) => void;
}) {
  const tree = useReferenceTree(context, kind);
  if (tree === null) {
    return (
      <div role="status" aria-label={`Loading ${COPY[kind].many}`} className="space-y-1 motion-reduce:[&_*]:animate-none">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (tree === "failed") {
    return (
      <RegistrationReferenceSelect name={name} label={label} value={value} kind={kind} selectedLabel={selectedLabel}
        context={context} rules={rules} error={error} onChange={onChange} />
    );
  }
  return (
    <RegistrationTreeSelect name={name} label={label} copy={COPY[kind]} tree={tree} value={value} error={error}
      maxLength={rules.search.maxLength} onChange={(node) => onChange(treeReference(tree, node, kind))} />
  );
}
