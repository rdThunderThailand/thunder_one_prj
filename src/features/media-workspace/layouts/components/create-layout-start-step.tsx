import type { ContentFolder } from "@/types/domain";

export type StartChoice = "blank" | "template";

export type StartDetails = {
  name: string;
  folderId: string;
  tags: string;
  width: string;
  height: string;
  background: string;
};

const inputClasses =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

function ChoiceIcon({ kind }: { kind: StartChoice }) {
  return kind === "blank" ? (
    <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden="true">
      <rect x="6" y="7" width="25" height="25" rx="3" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
      <path d="M27 27h9m-4.5-4.5v9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden="true">
      <rect x="4" y="8" width="26" height="21" rx="3" stroke="currentColor" strokeWidth="2" />
      <rect x="10" y="13" width="26" height="21" rx="3" fill="white" stroke="currentColor" strokeWidth="2" />
      <path d="M15 29h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChoiceCard({
  choice,
  selected,
  title,
  description,
  onSelect,
}: {
  choice: StartChoice;
  selected: boolean;
  title: string;
  description: string;
  onSelect: (choice: StartChoice) => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(choice)}
      className={`relative flex min-h-32 items-center gap-5 rounded-xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
        selected
          ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500 dark:bg-indigo-500/10"
          : "border-zinc-200 hover:border-indigo-300 dark:border-zinc-700"
      }`}
    >
      <span
        className={`absolute left-4 top-4 h-4 w-4 rounded-full border ${
          selected ? "border-[5px] border-indigo-600" : "border-zinc-300 dark:border-zinc-600"
        }`}
      />
      <span className="ml-3 shrink-0 text-indigo-600 dark:text-indigo-400">
        <ChoiceIcon kind={choice} />
      </span>
      <span>
        <span className="block font-semibold text-zinc-900 dark:text-zinc-100">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-zinc-500 dark:text-zinc-400">{description}</span>
      </span>
    </button>
  );
}

export function CreateLayoutStartStep({
  choice,
  details,
  folders,
  tagNames,
  onChoiceChange,
  onDetailsChange,
}: {
  choice: StartChoice;
  details: StartDetails;
  folders: ContentFolder[];
  tagNames: string[];
  onChoiceChange: (choice: StartChoice) => void;
  onDetailsChange: (details: StartDetails) => void;
}) {
  const set = (patch: Partial<StartDetails>) => onDetailsChange({ ...details, ...patch });

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">1. Choose how to start</legend>
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard
            choice="blank"
            selected={choice === "blank"}
            title="Blank Layout"
            description="Start with an empty canvas and create your own layout."
            onSelect={onChoiceChange}
          />
          <ChoiceCard
            choice="template"
            selected={choice === "template"}
            title="From Template"
            description="Choose from ready-made layout templates."
            onSelect={onChoiceChange}
          />
        </div>
      </fieldset>

      {choice === "blank" && (
        <>
          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">2. Layout information</legend>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Layout name <span className="text-red-500">*</span></span>
              <input
                autoFocus
                maxLength={100}
                value={details.name}
                onChange={(event) => set({ name: event.target.value })}
                placeholder="e.g. Corporate Lobby 3-Zone"
                className={inputClasses}
              />
              <span className="block text-right text-xs text-zinc-400">{details.name.length}/100</span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Folder <span className="font-normal text-zinc-400">(Optional)</span></span>
                <select value={details.folderId} onChange={(event) => set({ folderId: event.target.value })} className={inputClasses}>
                  <option value="">Uncategorized</option>
                  {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tags <span className="font-normal text-zinc-400">(Optional)</span></span>
                <input
                  list="new-layout-tags"
                  value={details.tags}
                  onChange={(event) => set({ tags: event.target.value })}
                  placeholder="Add tags, separated by commas"
                  className={inputClasses}
                />
                <datalist id="new-layout-tags">{tagNames.map((tag) => <option key={tag} value={tag} />)}</datalist>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">3. Canvas settings</legend>
            <div className="grid gap-3 sm:grid-cols-[1.25fr_1fr_1fr_1fr]">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Resolution</span>
                <select
                  value={`${details.width}x${details.height}`}
                  onChange={(event) => {
                    const [width, height] = event.target.value.split("x");
                    set({ width, height });
                  }}
                  className={inputClasses}
                >
                  <option value="1920x1080">1920 × 1080 (16:9)</option>
                  <option value="1080x1920">1080 × 1920 (9:16)</option>
                  <option value="3840x2160">3840 × 2160 (16:9)</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Width</span>
                <input type="number" min={100} max={99999} value={details.width} onChange={(event) => set({ width: event.target.value })} className={inputClasses} />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Height</span>
                <input type="number" min={100} max={99999} value={details.height} onChange={(event) => set({ height: event.target.value })} className={inputClasses} />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Background</span>
                <span className={`${inputClasses} flex items-center gap-2`}>
                  <input type="color" value={details.background} onChange={(event) => set({ background: event.target.value })} className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0" />
                  <span className="font-mono text-xs uppercase">{details.background}</span>
                </span>
              </label>
            </div>
          </fieldset>
        </>
      )}
    </div>
  );
}
