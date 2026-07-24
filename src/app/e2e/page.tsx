import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { E2EConsole } from "@/features/e2e";
import { LogoutButton } from "@/features/auth";

export default async function E2EPage() {
  const authed = Boolean((await cookies()).get("to_at")?.value);
  if (!authed) redirect("/login");

  return (
    <>
      <div className="flex justify-end p-3">
        <LogoutButton />
      </div>
      <E2EConsole />
    </>
  );
}
