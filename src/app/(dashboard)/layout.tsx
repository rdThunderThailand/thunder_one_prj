import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ShortcutsBar } from "@/components/layout/ShortcutsBar";
import { getCurrentUserName } from "@/features/auth/services/get-current-user";

// Route-group layout for the authenticated dashboard shell.
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userName = await getCurrentUserName();

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar userName={userName} />
        <main className="flex-1 overflow-y-auto bg-zinc-50 px-6 py-6 dark:bg-zinc-950">
          {children}
        </main>
        <ShortcutsBar />
      </div>
    </div>
  );
}

