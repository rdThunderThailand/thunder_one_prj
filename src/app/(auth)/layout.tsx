// Route-group layout for unauthenticated pages (login/register) — a minimal
// centered shell, deliberately separate from the dashboard shell.
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-1 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- real brand SVG, not a photo */}
          <img src="/brand/t1-logo-stacked.svg" alt="ThunderOne" className="h-16 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/t1-logo-stacked-dark.svg" alt="ThunderOne" className="hidden h-16 w-auto dark:block" />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {children}
        </div>
      </div>
    </div>
  );
}
