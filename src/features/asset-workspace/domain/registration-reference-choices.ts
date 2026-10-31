import type { RegistrationOptions } from "../services/asset-registration-contract.ts";
import type { RegistrationDraft } from "./registration-draft.ts";
import { locationPath } from "./registration-validation.ts";

export interface RegistrationReferenceChoice { value: string; label: string }

function distinguishNames(choices: RegistrationReferenceChoice[]): RegistrationReferenceChoice[] {
  const groups = new Map<string, RegistrationReferenceChoice[]>();
  for (const choice of choices) {
    const name = choice.label.trim().toLocaleLowerCase();
    groups.set(name, [...(groups.get(name) ?? []), choice]);
  }
  return choices.map((choice) => {
    const peers = groups.get(choice.label.trim().toLocaleLowerCase()) ?? [];
    if (peers.length < 2) return choice;
    let length = 8;
    // Legacy IDs can share a prefix or suffix. Expand the reference only when needed.
    while (length < 36 && peers.some((peer) => peer.value !== choice.value && peer.value.slice(-length) === choice.value.slice(-length))) {
      length = Math.min(length + 4, 36);
    }
    return { ...choice, label: `${choice.label} · ${choice.value.slice(-length)}` };
  }).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" }));
}

export function registrationLocationChoices(options: RegistrationOptions) {
  return distinguishNames(options.locations.map((location) => ({ value: location.id, label: locationPath(location.id, options) })));
}

export function registrationCustodyChoices(type: RegistrationDraft["custodyType"], options: RegistrationOptions) {
  if (type === "none") return [];
  if (type === "person") {
    return distinguishNames(options.persons.map((person) => ({ value: person.id, label: person.name?.trim() || "Unnamed person" })));
  }
  const byId = new Map(options.orgUnits.map((unit) => [unit.id, unit]));
  return distinguishNames(options.orgUnits.map((unit) => {
    const parts: string[] = [];
    const visited = new Set<string>();
    let current: typeof unit | undefined = unit;
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      parts.unshift(current.name?.trim() || "Unnamed organizational unit");
      current = current.parent_department_id ? byId.get(current.parent_department_id) : undefined;
    }
    return { value: unit.id, label: parts.join(" › ") };
  }));
}

export function registrationCustodyLabel(draft: RegistrationDraft, options: RegistrationOptions): string {
  if (draft.custodyType === "none") return "Unassigned";
  return registrationCustodyChoices(draft.custodyType, options).find((choice) => choice.value === draft.custodyId)?.label
    || (draft.custodyId ? "Previous custody selection is unavailable" : "Choose a custody target");
}
