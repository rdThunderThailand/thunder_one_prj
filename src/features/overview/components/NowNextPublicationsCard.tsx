import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { MoreIcon } from "@/components/ui/icons";
import {
  nextUpPublications,
  nowLivePublications,
  type PublicationRow,
} from "../mock-data";

function PublicationTable({ rows }: { rows: PublicationRow[] }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-xs text-zinc-400">
          <th className="pb-2 font-medium">Publication</th>
          <th className="pb-2 font-medium">Campaign</th>
          <th className="pb-2 font-medium">Channel</th>
          <th className="pb-2 font-medium">Status</th>
          <th className="pb-2 font-medium">Start Time</th>
          <th className="pb-2 font-medium" aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
            <td className="py-2.5 pr-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  {row.name[0]}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {row.name}
                  </p>
                  <p className="text-xs text-zinc-400">{row.version}</p>
                </div>
              </div>
            </td>
            <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">{row.campaign}</td>
            <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">{row.channel}</td>
            <td className="py-2.5 pr-3">
              <Badge variant="pill" color={row.status === "Live" ? "green" : "blue"}>
                {row.status}
              </Badge>
            </td>
            <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">{row.startTime}</td>
            <td className="py-2.5 text-right">
              <button
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                aria-label="More actions"
              >
                <MoreIcon />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function NowNextPublicationsCard() {
  return (
    <Card className="p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Now &amp; Next Publications
        </h2>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
          View all
        </button>
      </div>
      <Tabs
        items={[
          {
            key: "now",
            label: `Now Live (${nowLivePublications.length})`,
            content: <PublicationTable rows={nowLivePublications} />,
          },
          {
            key: "next",
            label: `Next Up (${nextUpPublications.length})`,
            content: <PublicationTable rows={nextUpPublications} />,
          },
        ]}
      />
    </Card>
  );
}
