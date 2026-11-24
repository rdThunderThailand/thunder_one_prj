import { UploadQueuePage } from "@/features/media-workspace/assets/upload/UploadQueuePage";

export default async function Page({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  const { folder } = await searchParams;
  return <UploadQueuePage initialFolderId={folder ?? null} />;
}
