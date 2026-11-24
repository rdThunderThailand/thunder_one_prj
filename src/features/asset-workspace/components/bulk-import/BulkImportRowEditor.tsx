"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { EditIcon } from "@/components/ui/icons";
import type { ImportEditResult } from "../../domain/asset-import-edit";
import type { ColumnMapping, ImportBatch, ImportOptions, ImportRow } from "../../domain/asset-import-types";
import { useAssetImportEdit } from "../../hooks/use-asset-import-edit";
import { useAssetImportEditNavigation } from "../../hooks/use-asset-import-edit-navigation";
import type { ImportEditorResources } from "../../hooks/use-import-editor-resources";
import type { AssetImportApi } from "../../services/asset-import-api";
import { BulkImportRowDetails } from "./BulkImportRowDetails";
import { BulkImportRowEditForm } from "./BulkImportRowEditForm";
import { BulkImportDiscardDialog, BulkImportRowEditFooter } from "./BulkImportRowEditFooter";

export type ImportEditorContext = {
  context: string; mapping: ColumnMapping; options: ImportOptions; disabled: boolean;
  onSaved: (result: ImportEditResult) => void; onReview: () => void;
};

export function BulkImportRowEditor({ api, batch, row, resources, editor, onClose, onReloadBatch, returnFocus, initialEditing = true }: {
  api: AssetImportApi; batch: ImportBatch; row: ImportRow; resources: ImportEditorResources; editor: ImportEditorContext;
  onClose: () => void; onReloadBatch?: () => void; returnFocus: () => void;
  initialEditing?: boolean;
}) {
  const navigation = useAssetImportEditNavigation(resources.rows, row);
  const [editing, setEditing] = useState(initialEditing);
  const [locked, setLocked] = useState(false);
  const [allFixed, setAllFixed] = useState(false);
  const [affected, setAffected] = useState<ImportRow[]>([]);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const canEdit = batch.status === "validated" && !editor.disabled && !locked && editor.mapping.some(Boolean);
  return (
    <RowEditorSession
      key={navigation.selected.id} {...{ api, batch, resources, editor, onClose, returnFocus, editing, setEditing,
        navigation, allFixed, setAllFixed, affected, setAffected, pending, setPending, canEdit }}
      onLocked={() => { setLocked(true); setEditing(false); onReloadBatch?.(); }}
    />
  );
}

function RowEditorSession({ api, batch, resources, editor, onClose, returnFocus, editing, setEditing, navigation,
  allFixed, setAllFixed, affected, setAffected, pending, setPending, canEdit, onLocked }: {
  api: AssetImportApi; batch: ImportBatch; resources: ImportEditorResources; editor: ImportEditorContext; onClose: () => void; returnFocus: () => void;
  editing: boolean; setEditing: (value: boolean) => void;
  navigation: ReturnType<typeof useAssetImportEditNavigation>; allFixed: boolean; setAllFixed: (value: boolean) => void;
  affected: ImportRow[]; setAffected: (rows: ImportRow[]) => void;
  pending: (() => void) | null; setPending: (action: (() => void) | null) => void;
  canEdit: boolean; onLocked: () => void;
}) {
  const edit = useAssetImportEdit(api, batch.id, navigation.selected, (result) => {
    editor.onSaved(result);
    const rows = navigation.replace(result);
    const affectedIds = new Set(result.affectedRows.map((row) => row.id));
    setAffected(rows.filter((row) => affectedIds.has(row.id) && row.severity !== "valid"));
  }, onLocked, batch.createdBy);
  const form = useRef<HTMLDivElement>(null);
  function guard(action: () => void) {
    if (edit.saving) return;
    if (editing && edit.dirty) setPending(() => action);
    else action();
  }
  async function reloadRow(discard = true) {
    await edit.reload(discard);
    // Another person may have changed more rows than this one.
    navigation.reload();
  }
  async function save(next: boolean) {
    const result = await edit.save();
    if (!result || !next) return;
    const target = navigation.nextIssue(result, navigation.replace(result));
    if (target) {
      navigation.setSelected(target);
      setAllFixed(false);
      if (target.id === result.row.id) form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
    else { setAllFixed(true); toast.success("All rows fixed. Continue to Review."); }
  }
  return (
    <>
      <BulkImportRowDetails
        row={edit.base} batch={batch} loading={false} position={navigation.position.total ? navigation.position : undefined}
        canPrevious={Boolean(navigation.previous) && !edit.saving} canNext={Boolean(navigation.next) && !edit.saving}
        onStep={(delta) => guard(() => {
          const target = delta < 0 ? navigation.previous : navigation.next;
          if (target) { navigation.setSelected(target); setAffected([]); setAllFixed(false); }
        })}
        onClose={() => guard(onClose)} onRetry={navigation.reload} returnFocus={returnFocus}
        description={editing && canEdit ? "Fix the values, then save. Each save re-checks the whole file." : undefined}
        issueCount={editing && canEdit ? edit.messages.length : undefined}
        editAction={!editing && canEdit ? (
          <Button variant={edit.base.severity === "valid" ? "ghost" : "outline"} size="sm"
            className="relative h-8 gap-1.5 px-2.5 after:absolute after:-inset-1.5 after:content-['']" onClick={() => setEditing(true)}>
            <EditIcon aria-hidden="true" className="size-3.5" />
            <span>{edit.base.severity === "valid" ? "Edit" : "Fix"}</span>
          </Button>
        ) : undefined}
        body={editing && canEdit ? (
          <div ref={form} className="space-y-3">
            {edit.error && (
              <div role="alert" className="space-y-2 rounded-control bg-error-muted p-3 text-xs text-error">
                <p>{edit.error}</p>
                {edit.recovery && (
                  <Button variant="outline" className="min-h-11" disabled={edit.saving} onClick={() => {
                    if (edit.recovery === "stale") guard(() => void reloadRow());
                    else void reloadRow(false);
                  }}>{edit.recovery === "stale" ? "Reload" : "Re-read row"}</Button>
                )}
              </div>
            )}
            <BulkImportRowEditForm
              edit={edit} context={editor.context} resources={resources} mapping={editor.mapping} options={editor.options}
              rows={navigation.rows} rowsReady={!navigation.loading && !navigation.error}
            />
            {(navigation.loading || navigation.error) && (
              <div role="status" className="text-xs text-muted-foreground">
                <p>{navigation.loading ? "Loading other rows…" : navigation.error}</p>
                {navigation.error && <Button variant="link" className="min-h-11" onClick={navigation.reload}>Try again</Button>}
              </div>
            )}
            {affected.map((row) => (
              <Button key={row.id} variant="link" className="min-h-11 whitespace-normal text-left text-xs"
                onClick={() => guard(() => navigation.setSelected(row))}>
                Row {row.rowIndex} now has an issue. View row
              </Button>
            ))}
            {allFixed && (
              <div role="status" className="space-y-2 text-sm">
                <p>All rows fixed. Continue to Review.</p>
                <Button className="min-h-11" onClick={() => guard(editor.onReview)}>Next</Button>
              </div>
            )}
            <p className="sr-only" aria-live="polite">{edit.saving ? "Saving row…" : edit.checking ? "Checking…" : ""}</p>
          </div>
        ) : undefined}
        footer={editing && canEdit ? (
          <BulkImportRowEditFooter saving={edit.saving}
            disabled={!edit.dirty || edit.saving || Boolean(edit.recovery) || navigation.loading || Boolean(navigation.error)}
            onSave={(next) => void save(next)} onCancel={() => guard(() => { edit.reset(); setEditing(false); })} />
        ) : undefined}
      />
      <BulkImportDiscardDialog rowIndex={edit.base.rowIndex} open={pending !== null}
        onOpenChange={(open) => { if (!open) setPending(null); }}
        onDiscard={() => { const action = pending; edit.reset(); setPending(null); action?.(); }} />
    </>
  );
}
