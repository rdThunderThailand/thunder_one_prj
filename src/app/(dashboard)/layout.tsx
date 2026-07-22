import Link from "next/link";

// Route-group layout for the dashboard shell (nav placeholder only).
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-col">
      <nav className="flex gap-4 border-b border-black/10 px-6 py-4 dark:border-white/10">
        <Link href="/videos">Videos</Link>
        <Link href="/screens">Screens</Link>
        <Link href="/playlists">Playlists</Link>
      </nav>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
