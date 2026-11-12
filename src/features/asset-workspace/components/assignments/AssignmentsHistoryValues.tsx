import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { CONDITION_TONE } from "../../domain/status-tone";
import { ASSIGNMENT_EVENT_LABEL, ASSIGNMENT_EVENT_TONE, assignmentHistoryDate } from "../../domain/assignment-history";
import type { AssignmentHistoryEvent } from "../../services/asset-assignments-contract";

export function AssignmentEventPill({ action }: { action: AssignmentHistoryEvent["action"] }) {
  return (
    <Badge color={ASSIGNMENT_EVENT_TONE[action]} variant="pill" className="whitespace-nowrap">
      {ASSIGNMENT_EVENT_LABEL[action]}
    </Badge>
  );
}

export function AssignmentHistoryPerson({ person, fallback = "—" }: {
  person: { name: string | null; avatarUrl?: string | null } | null;
  fallback?: string;
}) {
  if (!person?.name) return <span>{fallback}</span>;
  const name = person.name;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar name={name} src={person?.avatarUrl} size={28} />
      <span title={name} className="min-w-0 truncate font-semibold text-foreground">{name}</span>
    </div>
  );
}

export function AssignmentHistoryTime({ at }: { at: string }) {
  const value = assignmentHistoryDate(at);
  return (
    <time dateTime={at} className="block space-y-1 tabular-nums">
      <span className="block">{value.date}</span>
      <span className="block text-2xs text-muted-foreground">{value.time}</span>
    </time>
  );
}

export function AssignmentHistoryCondition({ condition }: { condition: AssignmentHistoryEvent["condition"] }) {
  if (!condition) return <span>—</span>;
  return (
    <Badge color={CONDITION_TONE[condition]} variant="pill" className="whitespace-nowrap">
      {condition}
    </Badge>
  );
}
