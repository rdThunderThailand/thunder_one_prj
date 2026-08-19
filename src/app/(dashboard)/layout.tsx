import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ShortcutsBar } from "@/components/layout/ShortcutsBar";
import { getSession } from "@/features/auth/services/get-session";

// Route-group layout for the authenticated dashboard shell. Gates the whole
// shell on tenant access so a member of no served tenant never reaches a page
// that would only fail request by request. /no-access deliberately lives
// outside this group — inside it, the redirect below would loop.
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (session === "forbidden") {
    redirect("/no-access");
  }
  const { userName } = session;

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

