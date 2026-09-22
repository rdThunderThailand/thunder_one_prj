import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/lovable/alert-dialog";

export function EmptyTrashDialog({ open, busy, targets, locked, onOpenChange, onConfirm }: {
  open: boolean;
  busy: boolean;
  targets: number;
  locked: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Empty Trash?</AlertDialogTitle>
          <AlertDialogDescription>
            Permanently delete {targets} playlist{targets === 1 ? "" : "s"} from Trash? This cannot be undone.
            {locked > 0 && <> {locked} playlist{locked === 1 ? "" : "s"} will be skipped because they have been published.</>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={busy || targets === 0} onClick={(event) => { event.preventDefault(); void onConfirm(); }} className="bg-danger hover:bg-danger">
            {busy ? "กำลังลบ…" : "Empty Trash"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
