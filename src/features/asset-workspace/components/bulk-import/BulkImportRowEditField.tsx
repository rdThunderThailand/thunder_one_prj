import { Checkbox } from "@/components/ui/lovable/checkbox";
import { AlertCircleIcon } from "@/components/ui/icons";
import { sameValueRows, isImportPicker } from "../../domain/asset-import-edit";
import type { ImportColumn, ImportRow } from "../../domain/asset-import-types";
import type { useAssetImportEdit } from "../../hooks/use-asset-import-edit";
import type { ImportEditorResources } from "../../hooks/use-import-editor-resources";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { RegistrationSelect, RegistrationTextField } from "../register-asset/RegistrationFields";
import { RegistrationDateField } from "../register-asset/RegistrationDateField";
import { BulkImportRowEditReferences } from "./BulkImportRowEditReferences";

export function BulkImportRowEditField({ column, edit, context, resources, rules, rows, conditions, rowsReady }: {
  column: ImportColumn; edit: ReturnType<typeof useAssetImportEdit>; context: string;
  resources: ImportEditorResources; rules: RegistrationOptions["referenceSelectors"]; rows: ImportRow[]; conditions: string[]; rowsReady: boolean;
}) {
  const field = column.key;
  const messages = edit.messages.filter((message) => message.field === field);
  const error = messages.filter((message) => message.severity === "error").map((message) => message.message).join(" ") || undefined;
  const warnings = messages.filter((message) => message.severity !== "error");
  const value = edit.draft[field] ?? "";
  const picker = isImportPicker(field);
  const count = picker && rowsReady ? sameValueRows(rows, edit.base, field) : 0;
  const showApply = picker && Object.hasOwn(edit.changes, field) && count > 0;
  const active = edit.latestPicker === field;
  const name = `import-${field}`;
  const common = { name, label: column.label, value, error, required: column.required };
  return (
    <div id={`import-field-${field}`} tabIndex={-1} className="min-w-0 scroll-mt-4 space-y-1 rounded-control focus-visible:outline-2 focus-visible:outline-ring">
      {picker ? (
        <BulkImportRowEditReferences
          field={field} label={column.label} value={value} context={context} resources={resources} rules={rules} error={error}
          onChange={(value) => edit.change(field, value)}
        />
      ) : field === "condition" ? (
        <RegistrationSelect
          {...common} onChange={(value) => edit.change(field, value === "__blank" ? "" : value)}
          items={[{ value: "__blank", label: "Default condition" },
            ...(value && !conditions.includes(value) ? [{ value, label: `${value} (not allowed)` }] : []),
            ...conditions.map((value) => ({ value, label: value }))]}
          value={value || "__blank"}
        />
      ) : field === "purchase_date" ? (
        <RegistrationDateField
          name={name} label={column.label} value={value} error={error}
          onChange={(value) => edit.change(field, value)}
        />
      ) : (
        <RegistrationTextField
          {...common} type="text"
          className="min-h-11" autoComplete="off" maxLength={column.maxLength ?? 5000}
          onChange={(event) => edit.change(field, event.target.value)}
        />
      )}
      <div className="min-h-5 text-xs" aria-live="polite">
        {edit.checking && (field === "serial_number" || field === "asset_tag") ? (
          <span className="text-muted-foreground">Checking…</span>
        ) : warnings.map((message, index) => (
          <span key={index} className="flex items-center gap-1 text-warning">
            <AlertCircleIcon aria-hidden="true" className="size-4 shrink-0" />
            <span>{message.message}</span>
          </span>
        ))}
      </div>
      {showApply && (
        <div className="space-y-1">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs">
            <Checkbox
              checked={active && edit.apply === field} disabled={!active || edit.saving}
              aria-describedby={!active ? `import-apply-${field}` : undefined}
              onCheckedChange={(checked) => { if (isImportPicker(field)) edit.setApply(checked === true ? field : null); }}
            />
            <span>
              Also apply to {count} other {count === 1 ? "row" : "rows"} with {edit.base.values[field]?.trim() ? `"${edit.base.values[field]}"` : `an empty ${column.label}`}
            </span>
          </label>
          {!active && (
            <p id={`import-apply-${field}`} className="text-xs text-muted-foreground">Apply one field at a time.</p>
          )}
        </div>
      )}
    </div>
  );
}
