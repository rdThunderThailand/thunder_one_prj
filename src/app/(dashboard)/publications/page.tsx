import { DraftList } from "@/features/publications";

export default function PublicationsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Publication Drafts
        </h1>
      </div>
      <DraftList />
    </div>
  );
}
