import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ compositionId: string }> }) {
  const { compositionId } = await params;
  redirect(`/media-workspace/layouts/${compositionId}`);
}
