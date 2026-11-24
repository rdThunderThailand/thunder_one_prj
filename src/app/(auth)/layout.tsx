// Route-group layout for unauthenticated pages (login/register) — a minimal
// centered shell, deliberately separate from the dashboard shell.
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-t1-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-1 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- real brand SVG, not a photo */}
          <img src="/brand/t1-logo-stacked.svg" alt="ThunderOne" className="h-16 w-auto" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/t1-logo-stacked-dark.svg" alt="ThunderOne" className="hidden h-16 w-auto" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
