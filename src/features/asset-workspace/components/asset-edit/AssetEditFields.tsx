import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/lovable/textarea";
import type { useAssetEdit } from "../../hooks/use-asset-edit";
import type { AssetEditOptions } from "../../services/asset-edit-options";
import type { ReferenceItem } from "../../services/registration-selector-contract";
import { RegistrationField, RegistrationTextField } from "../register-asset/RegistrationFields";
import { RegistrationReferenceSelect } from "../register-asset/RegistrationReferenceSelect";
import { RegistrationDateField } from "../register-asset/RegistrationDateField";

export function AssetEditFields({ context, flow, options, selected, onSelect }: {
  context: string; flow: ReturnType<typeof useAssetEdit>; options: AssetEditOptions;
  selected: ReferenceItem | null; onSelect: (item: ReferenceItem) => void;
}) {
  const { asset, draft, fields, patch } = flow;
  const current = options.currentCategory;
  const unchanged = draft.categoryId === asset.category?.id;
  const label = selected?.id === draft.categoryId ? selected.name || "Unnamed category"
    : unchanged ? `${asset.category?.name || "Uncategorized"}${current?.status === "Inactive" ? " (inactive)" : ""}` : "";
  return (
    <Card role="region" aria-labelledby="asset-edit-information" className="@container/asset-edit-fields space-y-4 p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
      <h2 id="asset-edit-information" className="text-sm font-semibold">Asset Information</h2>
      <fieldset disabled={flow.locked} className="min-w-0 space-y-4">
        <legend className="sr-only">Editable asset information</legend>
        <RegistrationTextField
          name="asset-edit-name" label="Asset Name" required value={draft.name} error={fields.name}
          className="h-10" autoComplete="off" onChange={(event) => patch({ name: event.target.value })}
        />
        <div className="space-y-1">
          <RegistrationReferenceSelect
            name="asset-edit-category" label="Category" kind="categories" context={context}
            rules={options.rules.referenceSelectors} value={draft.categoryId} selectedLabel={label}
            error={fields.categoryId} onChange={onSelect}
          />
          <p className="text-xs text-muted-foreground">Choose an active category. The current inactive category can be kept unchanged.</p>
          {asset.category && !current && <p className="text-xs text-muted-foreground">The current category status could not be confirmed. It will be kept unless you select another category.</p>}
        </div>
        <div className="grid min-w-0 gap-4 @min-lg/asset-edit-fields:grid-cols-2">
          <RegistrationTextField
            name="asset-edit-serial" label="Serial Number" value={draft.serialNumber} error={fields.serialNumber}
            className="h-10" autoComplete="off" onChange={(event) => patch({ serialNumber: event.target.value })}
          />
          <RegistrationDateField
            name="asset-edit-date" label="Acquisition Date" value={draft.acquisitionDate}
            error={fields.acquisitionDate} readOnly={flow.locked} onChange={(acquisitionDate) => patch({ acquisitionDate })}
          />
        </div>
        <RegistrationField name="asset-edit-notes" label="Notes" error={fields.notes}>
          <Textarea
            id="registration-asset-edit-notes" value={draft.notes} rows={4} className="min-h-24 resize-y"
            aria-invalid={Boolean(fields.notes)} aria-describedby={fields.notes ? "registration-asset-edit-notes-error" : undefined}
            onChange={(event) => patch({ notes: event.target.value })}
          />
        </RegistrationField>
      </fieldset>
    </Card>
  );
}
