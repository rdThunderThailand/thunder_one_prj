import { CreatePublicationWizard } from "@/features/publications";

export default function NewPublicationPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Create Publication
      </h1>
      <CreatePublicationWizard />
    </div>
  );
}
