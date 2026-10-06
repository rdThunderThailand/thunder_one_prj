import type { Metadata } from "next";
import { HelpBrowsePage } from "@/features/help/components/HelpListPages";
import { readHelpParams, type SearchParams } from "@/features/help/params";

export const metadata: Metadata = { title: "Browse" };

export default async function HelpBrowseRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <HelpBrowsePage params={readHelpParams(await searchParams)} />;
}
