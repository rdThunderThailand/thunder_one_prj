import type { Metadata } from "next";
import { MediaWorkspaceLayout } from "@/features/media-workspace/media-workspace-layout";

export const metadata: Metadata = { title: "Media Workspace" };

export default function MediaWorkspaceRouteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <MediaWorkspaceLayout>{children}</MediaWorkspaceLayout>;
}
