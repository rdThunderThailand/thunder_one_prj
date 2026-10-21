"use client";

import { Input } from "@/components/ui/lovable/input";
import { Label } from "@/components/ui/lovable/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { Textarea } from "@/components/ui/lovable/textarea";
import { ASSET_CONDITIONS, type AssetCondition } from "../../domain/asset-condition";
import type { AssetStatus } from "../../domain/asset-status";
import type { CustodyTarget } from "../../domain/custody";
import {
  fieldsFor,
  isReasonRequired,
  statusOptions,
  type ActionAsset,
  type ActionDraft,
  type ControlledActionKey,
} from "./controlled-action";

const CUSTODY_TYPES: { value: CustodyTarget["type"]; label: string }[] = [
  { value: "person", label: "Person" },
  { value: "org_unit", label: "Organizational unit" },
];

interface ActionFieldsProps {
  action: ControlledActionKey;
  asset: ActionAsset;
  draft: ActionDraft;
  onChange: (draft: ActionDraft) => void;
}

/** The Details step: only the inputs this action needs, per fieldsFor(). */
export function ActionFields({ action, asset, draft, onChange }: ActionFieldsProps) {
  const fields = fieldsFor(action);
  const isReasonNeeded = isReasonRequired(action, asset, draft);
  // CORE-GAP:custody-target — no person/org-unit directory yet, so custody is typed text with an empty id.
  const custody = draft.custody ?? { type: "person" as const, id: "", label: "" };

  return (
    <div className="space-y-4">
      {fields.includes("custody") && (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="space-y-1">
            <Label htmlFor="ca-custody-type">
              Custodian type
            </Label>
            <Select
              value={custody.type}
              onValueChange={(type) => onChange({ ...draft, custody: { ...custody, type: type as CustodyTarget["type"] } })}
            >
              <SelectTrigger id="ca-custody-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTODY_TYPES.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ca-custody-label">
              {action === "transfer" ? "Transfer to" : "Assign to"}
            </Label>
            <Input
              id="ca-custody-label"
              value={custody.label}
              onChange={(event) => onChange({ ...draft, custody: { ...custody, label: event.target.value } })}
              autoComplete="off"
            />
          </div>
        </div>
      )}

      {fields.includes("location") && (
        <div className="space-y-1">
          <Label htmlFor="ca-location">
            New location
          </Label>
          <Input
            id="ca-location"
            value={draft.location}
            onChange={(event) => onChange({ ...draft, location: event.target.value })}
            autoComplete="off"
          />
        </div>
      )}

      {fields.includes("status") && (
        <div className="space-y-1">
          <Label htmlFor="ca-status">
            Status
          </Label>
          <Select
            value={draft.status}
            onValueChange={(status) => onChange({ ...draft, status: status as AssetStatus })}
          >
            <SelectTrigger id="ca-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions(asset).map((status) => (
                <SelectItem
                  key={status}
                  value={status}
                >
                  {status === asset.status ? `${status} (no change)` : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {fields.includes("condition") && (
        <div className="space-y-1">
          <Label htmlFor="ca-condition">
            {action === "return" ? "Condition on return" : "Condition"}
          </Label>
          <Select
            value={draft.condition}
            onValueChange={(condition) => onChange({ ...draft, condition: condition as AssetCondition })}
          >
            <SelectTrigger id="ca-condition">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSET_CONDITIONS.map((condition) => (
                <SelectItem
                  key={condition}
                  value={condition}
                >
                  {condition}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="ca-reason">
          {isReasonNeeded ? "Reason" : "Reason (optional)"}
        </Label>
        <Textarea
          id="ca-reason"
          value={draft.reason}
          onChange={(event) => onChange({ ...draft, reason: event.target.value })}
          aria-required={isReasonNeeded}
          rows={3}
        />
      </div>
    </div>
  );
}
