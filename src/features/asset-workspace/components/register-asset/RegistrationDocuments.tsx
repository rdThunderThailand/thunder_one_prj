import { useRef, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { FileTextIcon, TrashIcon, UploadIcon, WarningTriangleIcon } from "@/components/ui/icons";
import type { RegistrationDocuments as DocumentsController } from "../../hooks/use-registration-documents";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { RegistrationField } from "./RegistrationFields";
import { cn } from "@/lib/utils";

export function RegistrationDocuments({ target, label, hasSelections, documents, rules }: {
  target: string; label: string; hasSelections: boolean; documents: DocumentsController; rules: RegistrationOptions["documentUpload"];
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const group = documents.groups[target];
  const files = group?.files ?? [];
  const retained = (documents.retained[target] ?? []).filter((file) => !files.some((local) => local.id === file.id));
  const missing = documents.missingIds(target);
  const max = rules ? target === "asset" ? rules.maxAssetDocuments : rules.maxDocumentsPerWarranty : 0;
  const name = `documents-${target}`;
  return (
    <RegistrationField name={name} label={label}>
      <input
        ref={input}
        id={`registration-${name}`}
        type="file"
        className="sr-only"
        tabIndex={-1}
        multiple
        aria-label={label}
        accept={rules?.extensions.join(",") ?? ".pdf,.jpg,.jpeg,.png"}
        onChange={(event) => {
          documents.select(target, Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <ul className="space-y-2" aria-label={`${label} selections`}>
        {missing.map((id, index) => (
          <DocumentSelectionRow
            key={id}
            filename={`Missing document ${index + 1}`}
            detail="Reselect or remove"
            missing
            removeLabel={`Remove missing document ${index + 1} from ${label}`}
            onRemove={() => documents.remove(target, id)}
          />
        ))}
        {retained.map((file) => (
          <DocumentSelectionRow
            key={file.id}
            filename={file.filename}
            detail="Verified upload"
            removeLabel={`Remove ${file.filename} from ${label}`}
            onRemove={() => documents.remove(target, file.id)}
          />
        ))}
        {files.map((document) => (
          <DocumentSelectionRow
            key={document.id}
            filename={document.file.name}
            detail={`${Math.ceil(document.file.size / 1024)} KiB · ${(documents.retained[target] ?? []).some((file) => file.id === document.id) ? "Verified upload" : "Local selection"}`}
            removeLabel={`Remove ${document.file.name} from ${label}`}
            onRemove={() => documents.remove(target, document.id)}
          />
        ))}
      </ul>
      {(!rules || files.length + retained.length < max) && (
        <div
          className={cn(
            "rounded-control border border-dashed border-primary/30 bg-accent/30 focus-within:ring-2 focus-within:ring-ring",
            dragging && "border-primary bg-accent",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            if (rules) setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            documents.select(target, Array.from(event.dataTransfer.files));
          }}
        >
          <Button
            variant="ghost"
            disabled={!rules}
            className="h-auto min-h-32 w-full flex-col gap-2 whitespace-normal p-4 text-xs text-accent-foreground hover:bg-accent"
            aria-label={`Add ${label.toLowerCase()}`}
            aria-describedby={`${name}-rules ${name}-state`}
            onClick={() => input.current?.click()}
          >
            <UploadIcon aria-hidden="true" className="size-6" />
            Drop files here or click to select
          </Button>
        </div>
      )}
      <p id={`${name}-rules`} className="text-xs leading-relaxed text-muted-foreground">
        {rules ? `${files.length + retained.length}/${max} documents · PDF, JPEG, PNG · Up to ${rules.maxBytesPerDocument / 1048576} MiB each.` : "Document limits are unavailable. Reload registration options to select files."}
      </p>
      <p id={`${name}-state`} className="text-xs leading-relaxed text-muted-foreground">
        {rules?.enabled ? "Local files only. Upload starts at final confirmation." : "Local files only. Backend document uploads are temporarily unavailable."}
      </p>
      {(missing.length > 0 || hasSelections && !files.length && !retained.length) && (
        <div role="status" className="space-y-2 rounded-control bg-warning-muted p-3 text-xs leading-relaxed text-foreground">
          <p>Please reselect missing documents or remove their selections. Verified uploads, warranty details and notes have been kept.</p>
          <Button
            variant="outline"
            size="sm"
            className="h-auto min-h-8 whitespace-normal text-start max-sm:min-h-10"
            onClick={() => documents.clearReminder(target)}
          >
            {retained.length || files.length ? "Continue without missing documents" : "Continue without these documents"}
          </Button>
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

function DocumentSelectionRow({ filename, detail, removeLabel, missing = false, onRemove }: {
  filename: string;
  detail: string;
  removeLabel: string;
  missing?: boolean;
  onRemove: () => void;
}) {
  return (
    <li className={cn("flex min-w-0 items-start gap-3 rounded-control border border-border p-3 text-xs", missing && "bg-warning-muted")}>
      {missing ? (
        <WarningTriangleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
      ) : (
        <FileTextIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-foreground" />
      )}
      <div className="min-w-0 flex-1 space-y-1 leading-relaxed">
        <p className="break-words font-medium text-foreground">{filename}</p>
        <p className="break-words text-muted-foreground">{detail}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="hover:text-error max-sm:size-10"
        aria-label={removeLabel}
        onClick={onRemove}
      >
        <TrashIcon aria-hidden="true" className="size-4" />
      </Button>
    </li>
  );
}
