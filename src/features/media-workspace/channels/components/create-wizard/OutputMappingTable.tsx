import { MonitorIcon } from "@/components/ui/icons";
import type { ChannelDisplayConfigScreen } from "../../types";

/** D4's "Map Displays to Outputs". The Player reports no real output topology (ticket 08
 *  deviation, confirmed against the live `player-candidates` contract), so `output` is a plain
 *  editable label auto-numbered by Auto Map — never claimed as "detected". */
export function OutputMappingTable({
  screens,
  onChange,
}: {
  screens: ChannelDisplayConfigScreen[];
  onChange: (screens: ChannelDisplayConfigScreen[]) => void;
}) {
  const updateOutput = (index: number, output: string) => {
    onChange(screens.map((screen) => (screen.index === index ? { ...screen, output } : screen)));
  };

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-400">
            <th className="px-3 py-2">Display</th>
            <th className="px-3 py-2">Output Label</th>
            <th className="px-3 py-2">Resolution</th>
          </tr>
        </thead>
        <tbody>
          {screens.map((screen) => (
            <tr key={screen.index} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                  <MonitorIcon className="h-3.5 w-3.5 text-zinc-400" />
                  Display {screen.index + 1}
                </span>
              </td>
              <td className="px-3 py-2">
                <input
                  value={screen.output}
                  onChange={(event) => updateOutput(screen.index, event.target.value)}
                  className="w-32 rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{screen.resolution}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-zinc-100 bg-zinc-50/60 px-3 py-2 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-400">
        Output labels are auto-numbered — the player does not report its real outputs yet. Rename
        them to match your cabling if you know it.
      </p>
    </div>
  );
}
