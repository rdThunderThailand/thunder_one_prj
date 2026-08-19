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
          <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            ThunderOne
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Media Workspace
          </span>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {children}
        </div>
      </div>
    </div>
  );
}
