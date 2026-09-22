import { buttonClasses } from "@/components/ui/Button";
import { CheckCircleIcon } from "@/components/ui/icons";

export function CreateChannelSuccessCard({
  channelName,
  onViewChannel,
  onCreateAnother,
}: {
  channelName: string;
  onViewChannel: () => void;
  onCreateAnother: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-success/30 bg-success-soft p-6 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-success text-white">
        <CheckCircleIcon className="h-8 w-8" />
      </span>
      <h3 className="text-lg font-semibold text-foreground">Channel Created!</h3>
      <p className="text-sm text-muted-foreground">&quot;{channelName}&quot; has been created successfully.</p>
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
