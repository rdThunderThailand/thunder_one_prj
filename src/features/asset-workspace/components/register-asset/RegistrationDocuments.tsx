import { useRef } from "react";
import { Button } from "@/components/ui/lovable/button";
import { FileTextIcon, TrashIcon, UploadIcon } from "@/components/ui/icons";
import type { RegistrationDocuments as DocumentsController } from "../../hooks/use-registration-documents";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { RegistrationField } from "./RegistrationFields";

export function RegistrationDocuments({ target, label, hasSelections, documents, rules }: {
  target: string; label: string; hasSelections: boolean; documents: DocumentsController; rules: RegistrationOptions["documentUpload"];
}) {
  const input = useRef<HTMLInputElement>(null);
  const group = documents.groups[target];
  const files = group?.files ?? [];
  const retained = (documents.retained[target] ?? []).filter((file) => !files.some((local) => local.id === file.id));
  const missing = documents.missingIds(target);
  const max = rules ? target === "asset" ? rules.maxAssetDocuments : rules.maxDocumentsPerWarranty : 0;
  const name = `documents-${target}`;
  return (
    <RegistrationField name={name} label={label}>
      <input
        ref={input} id={`registration-${name}`} type="file" className="sr-only" tabIndex={-1} multiple
        aria-label={label} accept={rules?.extensions.join(",") ?? ".pdf,.jpg,.jpeg,.png"}
        onChange={(event) => { documents.select(target, Array.from(event.target.files ?? [])); event.target.value = ""; }}
      />
      <ul className="space-y-2">
        {missing.map((id, index) => (
          <li key={id} className="flex items-center gap-2 rounded-control border border-border p-2 text-xs">
            <span className="min-w-0 flex-1 text-warning">Missing document {index + 1} · Reselect or remove</span>
            <Button variant="ghost" size="icon-sm" aria-label={`Remove missing document ${index + 1} from ${label}`} onClick={() => documents.remove(target, id)}>
              <TrashIcon className="h-4 w-4" />
            </Button>
          </li>
        ))}
        {retained.map((file) => (
          <li key={file.id} className="flex items-center gap-2 rounded-control border border-border p-2 text-xs">
            <FileTextIcon className="h-5 w-5 text-primary" />
            <span className="min-w-0 flex-1 break-words">{file.filename} · Verified upload</span>
            <Button variant="ghost" size="icon-sm" aria-label={`Remove ${file.filename} from ${label}`} onClick={() => documents.remove(target, file.id)}>
              <TrashIcon className="h-4 w-4" />
            </Button>
          </li>
        ))}
        {files.map((document) => (
          <li key={document.id} className="flex items-center gap-2 rounded-control border border-border p-2 text-xs">
            <FileTextIcon className="h-5 w-5 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="break-words">{document.file.name}</p>
              <p className="text-2xs text-muted-foreground">{Math.ceil(document.file.size / 1024)} KiB · {(documents.retained[target] ?? []).some((file) => file.id === document.id) ? "Verified upload" : "Local selection"}</p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label={`Remove ${document.file.name} from ${label}`} onClick={() => documents.remove(target, document.id)}>
              <TrashIcon className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
      {(!rules || files.length + retained.length < max) && (
        <div
          className="rounded-control border border-dashed border-border p-3"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); documents.select(target, Array.from(event.dataTransfer.files)); }}
        >
          <Button variant="ghost" disabled={!rules} className="h-auto min-h-12 w-full flex-col whitespace-normal text-primary" aria-label={`Add ${label.toLowerCase()}`} onClick={() => input.current?.click()}>
            <UploadIcon className="h-5 w-5" />
            Drop files here or click to select
          </Button>
        </div>
      )}
      <p className="text-2xs text-muted-foreground">
        {rules ? `${files.length + retained.length}/${max} documents · PDF, JPEG, PNG · Up to ${rules.maxBytesPerDocument / 1048576} MiB each.` : "Document limits are unavailable. Reload registration options to select files."}
      </p>
      <p className="text-2xs text-muted-foreground">{rules?.enabled ? "Local files only. Upload starts at final confirmation." : "Local files only. Backend document uploads are temporarily unavailable."}</p>
      {(missing.length > 0 || hasSelections && !files.length && !retained.length) && (
        <div role="status" className="space-y-2 rounded-control bg-warning-muted p-3 text-xs">
          <p>Please reselect missing documents or remove their selections. Verified uploads, warranty details and notes have been kept.</p>
          <Button variant="outline" size="sm" onClick={() => documents.clearReminder(target)}>{retained.length || files.length ? "Continue without missing documents" : "Continue without these documents"}</Button>
        </div>
      )}
      {Boolean(group?.errors.length) && (
        <ul role="alert" className="space-y-1 text-xs text-error">
          {group.errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </RegistrationField>
  );
}
