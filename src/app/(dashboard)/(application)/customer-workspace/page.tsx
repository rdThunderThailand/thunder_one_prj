import { OverviewPage } from "@/features/customer-workspace";

// Customer Workspace's landing page ("ภาพรวม"). Brand-new App, no Core
// integration exists for customers/renewals/contracts yet — every number on
// this page comes from features/customer-workspace/mock-data.ts, straight
// off the Figma mockup's own sample data.
export default function CustomerWorkspacePage() {
  return <OverviewPage />;
}
