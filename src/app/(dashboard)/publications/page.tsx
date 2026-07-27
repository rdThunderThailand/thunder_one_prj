import { DraftList } from "@/features/publications";

type PublicationsPageProps = {
  searchParams: Promise<{ published?: string }>;
};

export default async function PublicationsPage({ searchParams }: PublicationsPageProps) {
  const { published } = await searchParams;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Active Publications
      </h1>
      <DraftList status="active" publishedName={published} />

      <h1 className="pt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Publication Drafts
      </h1>
      <DraftList status="draft" />
    </div>
  );
}
