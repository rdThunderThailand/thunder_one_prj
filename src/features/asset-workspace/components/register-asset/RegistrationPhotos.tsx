import Image from "next/image";
import { useRef } from "react";
import { Button } from "@/components/ui/lovable/button";
import { PlusIcon, XIcon } from "@/components/ui/icons";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import type { RegistrationPhoto } from "../../hooks/use-registration-photos";
import { RegistrationSection } from "./RegistrationFields";
import type { RetainedRegistrationFile } from "../../hooks/use-registration-documents";
import { cn } from "@/lib/utils";

export function RegistrationPhotos({ photos, errors, rules, needsReselection, onSelect, onRemove, onClearReminder, retained = [] }: {
  photos: RegistrationPhoto[]; errors: string[]; rules: RegistrationOptions["photoUpload"];
  needsReselection: boolean; onSelect: (files: File[]) => void; onRemove: (id: string) => void;
  onClearReminder: () => void;
  retained?: RetainedRegistrationFile[];
}) {
  const input = useRef<HTMLInputElement>(null);
  const saved = retained.filter((file) => !photos.some((photo) => photo.id === file.id));
  const full = Boolean(rules && photos.length + saved.length >= rules.maxPhotos);
  return (
    <RegistrationSection title="Asset photos (optional)" description="Add photos to help identify this asset.">
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        className="sr-only"
        tabIndex={-1}
        aria-label="Select asset photos"
        onChange={(event) => {
          onSelect(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        {saved.map((file) => (
          <div key={file.id} className="min-w-0 space-y-2 rounded-control border border-border p-2 text-xs">
            <p className="break-words">{file.filename}</p>
            <p className="text-muted-foreground">Verified upload · local preview unavailable</p>
            <Button
              variant="outline"
              size="sm"
              className="max-sm:h-10"
              aria-label={`Remove photo ${file.filename}`}
              onClick={() => onRemove(file.id)}
            >
              Remove
            </Button>
          </div>
        ))}
        {photos.map((photo) => (
          <div key={photo.id} className="min-w-0 space-y-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-control border border-border bg-muted">
              <Image
                src={photo.previewUrl}
                alt={photo.file.name}
                fill
                unoptimized
                sizes="(max-width: 639px) 50vw, 240px"
                className="object-contain"
              />
              <Button
                variant="secondary"
                size="icon-sm"
                className="absolute right-1 top-1 max-sm:size-10"
                aria-label={`Remove photo ${photo.file.name}`}
                onClick={() => onRemove(photo.id)}
              >
                <XIcon aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
            <p className="truncate text-xs text-muted-foreground" title={photo.file.name}>
              {photo.file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {retained.some((file) => file.id === photo.id) ? "Verified upload" : "Local selection"}
            </p>
          </div>
        ))}
        {!full && (
          <Button
            variant="outline"
            className={cn(
              "h-auto min-h-32 flex-col gap-2 whitespace-normal border-dashed border-primary/30 bg-accent/30 p-4 text-accent-foreground hover:bg-accent",
              !photos.length && !saved.length && "col-span-2 min-h-40",
            )}
            disabled={!rules}
            aria-describedby="registration-photo-rules registration-photo-state"
            onClick={() => input.current?.click()}
          >
            <PlusIcon aria-hidden="true" className="h-6 w-6" />
            Add Photos
            <span className="text-xs font-normal text-muted-foreground">JPEG or PNG</span>
          </Button>
        )}
      </div>
      <p id="registration-photo-rules" className="text-xs leading-relaxed text-muted-foreground">
        {rules ? `${photos.length + saved.length}/${rules.maxPhotos} photos · Up to ${rules.maxBytesPerPhoto / 1048576} MiB each.` : "Photo limits are unavailable. Reload registration options to select photos."}
      </p>
      <p id="registration-photo-state" className="text-xs leading-relaxed text-muted-foreground">
        {retained.length ? "Verified uploads are retained for confirmation. New selections upload only on confirmation." : rules?.enabled ? "Local previews only. Upload starts at final confirmation." : "Local previews only. Backend photo uploads are temporarily unavailable."}
      </p>
      {needsReselection && (
        <div className="space-y-2 rounded-control bg-warning-muted p-3 text-xs text-foreground" role="status">
          <p>Some selected photos could not be restored. Their local cache may have expired or been cleared. Reselect them or remove their selections; your other information has been kept.</p>
          <Button
            variant="outline"
            size="sm"
            className="h-auto min-h-8 whitespace-normal text-start max-sm:min-h-10"
            onClick={onClearReminder}
          >
            {photos.length || retained.length ? "Continue without missing photos" : "Continue without photos"}
          </Button>
        </div>
      )}
      {errors.length > 0 && (
        <ul className="space-y-1 text-xs text-error" role="alert">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </RegistrationSection>
  );
}
