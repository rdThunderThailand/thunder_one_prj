import { ChannelEditorPage } from "@/features/communication/channels";

export default async function Page({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  return <ChannelEditorPage channelId={channelId} />;
}
