import Link from "next/link";

export function ProgramBreadcrumb({ listHref, name }: { listHref: string; name: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"
    >
      <Link
        href={listHref}
        className="hover:text-foreground"
      >
        Programs
      </Link>
      <span aria-hidden>›</span>
      <span className="max-w-64 truncate">{name}</span>
      <span aria-hidden>›</span>
      <span className="font-medium text-foreground">Edit</span>
    </nav>
  );
}
