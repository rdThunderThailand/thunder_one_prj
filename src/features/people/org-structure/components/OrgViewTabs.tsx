import { orgViewTabs, type OrgViewTabId } from "../mock-data";

interface OrgViewTabsProps {
  active: OrgViewTabId;
  onChange: (id: OrgViewTabId) => void;
}

export function OrgViewTabs({ active, onChange }: OrgViewTabsProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700">
      {orgViewTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            active === tab.id
              ? "bg-indigo-600 text-white"
              : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
