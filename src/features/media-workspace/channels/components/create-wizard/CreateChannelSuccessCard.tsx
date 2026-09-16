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
    <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white">
        <CheckCircleIcon className="h-8 w-8" />
      </span>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Channel Created!</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">&quot;{channelName}&quot; has been created successfully.</p>
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
