import { Button } from "@/components/ui/Button";
import { SpinnerIcon } from "@/components/ui/icons";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/lovable/alert-dialog";

export function BulkImportRowEditFooter({ saving, disabled, onSave, onCancel }: {
  saving: boolean; disabled: boolean; onSave: (next: boolean) => void; onCancel: () => void;
}) {
  return (
    <div className="flex w-full justify-end gap-2">
      <Button variant="outline" className="min-h-11" disabled={saving} onClick={onCancel}>Cancel</Button>
      <Button variant="outline" className="min-h-11 sm:min-w-24" disabled={disabled} onClick={() => onSave(false)}>
        {saving && <SpinnerIcon aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />}
        <span>Save</span>
      </Button>
      <Button className="min-h-11 sm:min-w-48" disabled={disabled} onClick={() => onSave(true)}>
        {saving && <SpinnerIcon aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />}
        <span>Save &amp; next issue</span>
      </Button>
    </div>
  );
}

export function BulkImportDiscardDialog({ rowIndex, open, onOpenChange, onDiscard }: {
  rowIndex: number; open: boolean; onOpenChange: (open: boolean) => void; onDiscard: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogDescription>Discard changes to row {rowIndex}?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction className="bg-error text-error-foreground hover:bg-error/90" onClick={onDiscard}>Discard changes</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
