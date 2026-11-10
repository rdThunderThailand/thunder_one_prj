import { Avatar } from "@/components/ui/Avatar";
import { UsersIcon } from "@/components/ui/icons";

/** A person (avatar + department) or an org unit (group icon), as the FE 01 table shows custodians. */
export function AssignHolder({ type, name, secondary, avatarUrl = null }: {
  type: "person" | "org_unit"; name: string | null; secondary?: string | null; avatarUrl?: string | null;
}) {
  const label = name || "Unnamed custodian";
  return (
    <span className="flex min-w-0 items-center gap-2">
      {type === "person" ? (
        <Avatar
          name={label}
          src={avatarUrl}
          size={32}
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <UsersIcon className="size-4" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-foreground wrap-anywhere">{label}</span>
        <span className="block text-2xs text-muted-foreground wrap-anywhere">
          {type === "org_unit" ? "Organizational Unit" : secondary || "Person"}
        </span>
      </span>
    </span>
  );
}
