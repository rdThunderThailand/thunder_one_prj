import { buttonClasses } from "@/components/ui/Button";
import { CheckCircleIcon } from "@/components/ui/icons";

export function CreateChannelSuccessCard({
  channelName,
  isDraft,
  onViewChannel,
  onCreateAnother,
}: {
  channelName: string;
  /** Saved with no Player yet (ADR 0122 rule 6) — the card, not a toast, says what comes next. */
  isDraft: boolean;
  onViewChannel: () => void;
  onCreateAnother: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-success/30 bg-success-muted p-6 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-success text-success-foreground">
        <CheckCircleIcon className="h-8 w-8" />
      </span>
      <h3 className="text-lg font-semibold text-foreground">{isDraft ? "Saved as Draft" : "Channel Created!"}</h3>
      <p className="text-sm text-muted-foreground">
        {isDraft
          ? `"${channelName}" has no Player yet — add a Player, then Activate.`
          : `"${channelName}" has been created successfully.`}
      </p>
      <div className="mt-2 flex w-full flex-col gap-2">
        <button type="button" onClick={onViewChannel} className={buttonClasses("primary", "w-full")}>
          View Channel
        </button>
        <button type="button" onClick={onCreateAnother} className={buttonClasses("secondary", "w-full")}>
          Create Another Channel
        </button>
      </div>
    </div>
  );
}
