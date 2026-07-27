import { CreatePublicationWizard } from "@/features/publications";

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function NewPublicationPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Create Publication
      </h1>
      <CreatePublicationWizard initialPublicationId={id} />
    </div>
  );
}
