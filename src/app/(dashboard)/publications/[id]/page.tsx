import Link from "next/link";
import { PublicationDetailView } from "@/features/publications";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicationDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="space-y-6 p-6">
      <Link href="/publications" className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
        ← กลับไปหน้า Publications
      </Link>
      <PublicationDetailView id={id} />
    </div>
  );
}
