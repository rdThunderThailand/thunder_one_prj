import type { Metadata } from "next";
import { HelpArticlePage, articleTitle } from "@/features/help/components/HelpArticlePage";
import { readHelpParams, type SearchParams } from "@/features/help/params";
import { getAppLocale } from "@/lib/app-locale.server";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = readHelpParams(await searchParams, await getAppLocale());
  return { title: articleTitle(slug, locale) ?? "Article not available" };
}

export default async function HelpArticleRoute({ params, searchParams }: Props) {
  const { slug } = await params;
  return <HelpArticlePage slug={slug} params={readHelpParams(await searchParams, await getAppLocale())} />;
}
