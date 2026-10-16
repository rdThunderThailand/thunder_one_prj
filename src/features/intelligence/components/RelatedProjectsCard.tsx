import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ShareNodesIcon, SparklesIcon, StarIcon, TargetIcon } from "@/components/ui/icons";
import { relatedProjects, type ProjectStatus, type RelatedProjectData } from "../mock-data";

const iconFor: Record<RelatedProjectData["icon"], React.ReactNode> = {
  target: <TargetIcon className="h-3.5 w-3.5" />,
  share: <ShareNodesIcon className="h-3.5 w-3.5" />,
  sparkles: <SparklesIcon className="h-3.5 w-3.5" />,
  star: <StarIcon className="h-3.5 w-3.5" />,
};

const statusColor: Record<ProjectStatus, BadgeColor> = {
  "On Track": "green",
  "At Risk": "yellow",
};

export function RelatedProjectsCard() {
  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-foreground">Related Projects</h2>
      <ul className="flex flex-1 flex-col gap-3">
        {relatedProjects.map((project) => (
          <li key={project.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm text-foreground">
                <span className="text-t1-gray-400">{iconFor[project.icon]}</span>
                <span className="font-medium text-foreground">{project.title}</span>
              </span>
              <Badge variant="pill" color={statusColor[project.status]}>{project.status}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <ProgressBar value={project.percent} color={project.status === "At Risk" ? "amber" : "indigo"} className="flex-1" />
              <span className="w-9 text-right text-xs font-medium text-muted-foreground">{project.percent}%</span>
            </div>
            <p className="text-xs text-t1-gray-400">{project.category}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
