import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/services/get-session";

export default async function PreviewLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (await getSession() === "forbidden") redirect("/no-access");
  return children;
}
