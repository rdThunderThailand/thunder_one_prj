import { HelpHomePage } from "@/features/help/components/HelpHomePage";
import { readHelpParams, type SearchParams } from "@/features/help/params";
import { getAppLocale } from "@/lib/app-locale.server";

export default async function HelpCenterHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <HelpHomePage params={readHelpParams(await searchParams, await getAppLocale())} />;
}
