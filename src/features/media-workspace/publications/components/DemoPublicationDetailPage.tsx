import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { buttonClasses } from "@/components/ui/Button";
import { getDemoPublication } from "../now-next-demo";

export function DemoPublicationDetailPage({ id }: { id: string }) {
  const detail = getDemoPublication(id);
  if (!detail) return <Card className="p-6 text-center text-sm text-danger">Demo publication not found</Card>;
  const { publication, occurrence, channelName } = detail;
  return <div className="flex flex-col gap-4">
    <PageHeader title={publication.name} subtitle="Publication Detail" actions={<Link className={buttonClasses("secondary")} href="/media-workspace/publications">Back to Now & Next</Link>} />
    <Card className="p-5">
      <div className="flex items-start gap-5">
        <MediaThumb url={publication.thumbnail_url ?? undefined} alt={publication.name} className="h-36 w-60 rounded-xl" />
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="text-xl font-extrabold tracking-tight text-foreground">{publication.name}</h2><Badge color="blue" variant="pill">Demo data</Badge></div><p className="mt-1 text-sm text-muted-foreground">{publication.publication_type} · {channelName}</p><dl className="mt-5 grid max-w-xl grid-cols-[140px_1fr] gap-y-3 text-sm"><dt className="text-muted-foreground">Priority</dt><dd className="capitalize">{occurrence.priority}</dd><dt className="text-muted-foreground">Starts</dt><dd>{new Date(occurrence.opens_at).toLocaleString()}</dd><dt className="text-muted-foreground">Ends</dt><dd>{occurrence.closes_at ? new Date(occurrence.closes_at).toLocaleString() : "Open ended"}</dd><dt className="text-muted-foreground">Output</dt><dd>{occurrence.output_kind === "merged_loop" ? "Merged loop" : "Publication"}</dd></dl></div>
      </div>
    </Card>
  </div>;
}
