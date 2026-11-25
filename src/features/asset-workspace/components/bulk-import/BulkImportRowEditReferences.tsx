"use client";

import { useEffect, useState } from "react";
import type { ImportPicker } from "../../domain/asset-import-edit";
import type { ImportEditorResources } from "../../hooks/use-import-editor-resources";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import type { ReferenceItem } from "../../services/registration-selector-contract";
import { RegistrationSelect } from "../register-asset/RegistrationFields";
import { RegistrationReferenceSelect } from "../register-asset/RegistrationReferenceSelect";
import { RegistrationTreeField } from "../register-asset/RegistrationTreeField";

export function BulkImportRowEditReferences({ field, label, value, context, resources, rules, error, onChange }: {
  field: ImportPicker; label: string; value: string; context: string;
  resources: ImportEditorResources; rules: RegistrationOptions["referenceSelectors"]; error?: string; onChange: (value: string) => void;
}) {
  const [selected, setSelected] = useState<ReferenceItem | null>(null);
  const [kind, setKind] = useState(value ? "current" : "none");
  const [selectionError, setSelectionError] = useState("");
  // Import matches Category/Location by code, full path or unique name, so fall back to the name when there is no code.
  const importValue = (item: ReferenceItem) => field === "assignee" && kind === "persons" ? item.name : item.code?.trim() || item.name;
  const current = selected && importValue(selected)?.trim().toLowerCase() === value.trim().toLowerCase() ? selected : null;
  const known = current !== null;
  useEffect(() => {
    if (known || field === "assignee" || !value.trim()) return;
    let active = true;
    void resources.lookup(field === "category" ? "categories" : "locations", value)
      .then((item) => { if (item && active) setSelected(item); }).catch(() => undefined);
    return () => { active = false; };
  }, [resources, field, value, known]);
  function select(item: ReferenceItem) {
    const next = importValue(item);
    if (!next?.trim()) { setSelectionError("This item can't be used in an import. Choose another one."); return; }
    setSelectionError("");
    setSelected(item);
    onChange(next);
  }
  const props = { name: `import-${field}`, label, value: current?.id ?? value, selectedLabel: current?.name ?? value,
    context, rules, error: selectionError || error, onChange: select };
  if (field !== "assignee") {
    return (
      <RegistrationTreeField {...props} keptTrees={resources.trees} kind={field === "category" ? "categories" : "locations"} />
    );
  }
  return (
    <div className="space-y-2">
      <RegistrationSelect
        name="import-assignee-kind" label="Assignee" value={kind}
        items={[...(kind === "current" ? [{ value: "current", label: "Keep current value" }] : []),
          { value: "none", label: "Unassigned" }, { value: "persons", label: "Person" },
          { value: "orgUnits", label: "Organizational unit" }]}
        onChange={(kind) => { setKind(kind); setSelected(null); if (kind === "none") onChange(""); }}
      />
      {kind === "current" && <p className="wrap-anywhere text-xs text-muted-foreground">{value}</p>}
      {kind === "persons" && (
        <RegistrationReferenceSelect {...props} label="Person" kind="persons" />
      )}
      {kind === "orgUnits" && (
        <RegistrationTreeField {...props} keptTrees={resources.trees} label="Organizational unit" kind="orgUnits" />
      )}
    </div>
  );
}
