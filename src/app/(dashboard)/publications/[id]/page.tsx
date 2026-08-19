import { PublicationDetailPage } from "@/features/publications";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PublicationDetailPage id={id} />;
}
