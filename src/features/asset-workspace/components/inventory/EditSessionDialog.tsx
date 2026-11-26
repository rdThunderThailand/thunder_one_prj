"use client";

// Edit Session (checklist §1.1): Name, Description, Due Date and Owner of an In Progress session. The scope is locked once
// started (Core answers SCOPE_LOCKED). Only changed fields are sent; `expectedUpdatedAt` guards a lost update (STALE).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Label } from "@/components/ui/lovable/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { Textarea } from "@/components/ui/lovable/textarea";
import { DESCRIPTION_MAX, NAME_MAX, validateSetup, type Person, type SessionDetail, type SetupDraft, type SetupInput } from "../../domain/inventory";
import { updateSessionAction } from "../../services/asset-inventory-actions";
import { FieldError, FormError } from "./parts";
import { DialogShell } from "./VerifyDialogs";

const day = (iso: string | null) => (iso ?? "").slice(0, 10);

export function EditSessionDialog({ session, owners, onClose }: { session: SessionDetail; owners: Person[]; onClose: () => void }) {
  const router = useRouter();
  const [draft, setDraft] = useState<SetupDraft>({
    name: session.name,
    description: session.description ?? "",
    dueDate: day(session.dueDate),
    ownerUserId: session.owner?.id ?? "",
  });
  const [fields, setFields] = useState<Partial<Record<keyof SetupDraft, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const set = (key: keyof SetupDraft) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));
  // The current owner stays choosable even if the owners list no longer holds them.
  const choices = session.owner && !owners.some((o) => o.id === session.owner?.id) ? [session.owner, ...owners] : owners;

  async function save() {
    const checked = validateSetup(draft);
    if (!checked.ok) {
      setFields(checked.fields);
      return;
    }
    setFields({});
    const { input } = checked;
    const changes: Partial<SetupInput> = {};
    if (input.name !== session.name) changes.name = input.name;
    if ((input.description ?? null) !== (session.description || null)) changes.description = input.description;
    if (input.dueDate !== day(session.dueDate)) changes.dueDate = input.dueDate;
    if (input.ownerUserId && input.ownerUserId !== session.owner?.id) changes.ownerUserId = input.ownerUserId;
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }
    setError(null);
    setSending(true);
    const res = await updateSessionAction(session.id, session.updatedAt, changes);
    setSending(false);
    if (res.ok) {
      onClose();
      return;
    }
    if (res.code === "STALE") router.refresh();
    setError(res.message);
  }

  return (
    <DialogShell
      open
      onOpenChange={(o) => !o && onClose()}
      busy={sending}
      title="Edit Session"
      description="Name, description, due date and owner. The scope is locked once the session has started."
      footer={
        <>
          <Button
            variant="outline"
            disabled={sending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            disabled={sending}
            onClick={() => void save()}
          >
            {sending ? "Saving…" : "Save Changes"}
          </Button>
        </>
      }
    >
      <FormError message={error} />
      <div className="space-y-1.5">
        <Label htmlFor="edit-name">Session Name *</Label>
        <Input
          id="edit-name"
          maxLength={NAME_MAX}
          value={draft.name}
          onChange={(e) => set("name")(e.target.value)}
          aria-invalid={Boolean(fields.name) || undefined}
          aria-describedby="edit-name-error"
        />
        <FieldError
          id="edit-name-error"
          message={fields.name}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          rows={3}
          maxLength={DESCRIPTION_MAX}
          value={draft.description}
          onChange={(e) => set("description")(e.target.value)}
          aria-invalid={Boolean(fields.description) || undefined}
          aria-describedby="edit-description-error"
        />
        <FieldError
          id="edit-description-error"
          message={fields.description}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="edit-due">Due Date *</Label>
          <Input
            id="edit-due"
            type="date"
            value={draft.dueDate}
            onChange={(e) => set("dueDate")(e.target.value)}
            aria-invalid={Boolean(fields.dueDate) || undefined}
            aria-describedby="edit-due-error"
          />
          <FieldError
            id="edit-due-error"
            message={fields.dueDate}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-owner">Owner</Label>
          <Select
            value={draft.ownerUserId}
            onValueChange={set("ownerUserId")}
          >
            <SelectTrigger id="edit-owner">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {choices.map((o) => (
                <SelectItem
                  key={o.id}
                  value={o.id}
                >
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </DialogShell>
  );
}
