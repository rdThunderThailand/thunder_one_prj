import { DemoPublicationDetailPage, PublicationDetailPage } from "@/features/media-workspace/publications";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return process.env.NODE_ENV === "development" && id.startsWith("demo-") ? <DemoPublicationDetailPage id={id} /> : <PublicationDetailPage id={id} />;
}
