import { HelpHomePage } from "@/features/help/components/HelpHomePage";
import { readHelpParams, type SearchParams } from "@/features/help/params";

export default async function HelpCenterHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <HelpHomePage params={readHelpParams(await searchParams)} />;
}
