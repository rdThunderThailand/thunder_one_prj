import { MediaWorkspaceLayout } from "@/features/media-workspace/media-workspace-layout";

export default function MediaWorkspaceRouteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <MediaWorkspaceLayout>{children}</MediaWorkspaceLayout>;
}
