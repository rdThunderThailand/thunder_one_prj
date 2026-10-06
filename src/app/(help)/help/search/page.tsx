import type { Metadata } from "next";
import { HelpSearchPage } from "@/features/help/components/HelpListPages";
import { readHelpParams, type SearchParams } from "@/features/help/params";

export const metadata: Metadata = { title: "Search" };

export default async function HelpSearchRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <HelpSearchPage params={readHelpParams(await searchParams)} />;
}
