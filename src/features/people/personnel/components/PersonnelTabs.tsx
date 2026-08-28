import { personnelTabs, type PersonnelTab } from "../mock-data";

interface PersonnelTabsProps {
  active: PersonnelTab["id"];
  onChange: (id: PersonnelTab["id"]) => void;
}

// Real, client-side — unlike most decorative chrome on this page, filtering
// personnelRows by type is cheap since the type field already exists on
// every mock row (see mock-data.ts's header comment on tab counts vs. row
// counts).
export function PersonnelTabs({ active, onChange }: PersonnelTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {personnelTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
            active === tab.id
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          {tab.label}
          <span
            className={`rounded-full px-1.5 py-0.5 text-[11px] ${
              active === tab.id
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
