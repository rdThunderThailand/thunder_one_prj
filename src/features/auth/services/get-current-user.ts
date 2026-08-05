import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { env } from "@/config/env";

export async function getCurrentUserName(): Promise<string> {
  const token = (await cookies()).get("to_at")?.value;
  if (!token) {
    redirect("/login");
  }

  let res: Response;
  try {
    res = await fetch(`${env.coreApiUrl}/api/core/v1/me`, {
      headers: {
        "x-api-key": env.coreApiKey,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    return "Account";
  }

  if (res.status === 401) {
    redirect("/login");
  }
  if (!res.ok) {
    return "Account";
  }

  const body = await res.json().catch(() => null);
  const user = body?.data;
  if (!user) {
    return "Account";
  }

  const displayName = String(user.display_name ?? "").trim();
  if (displayName) return displayName;

  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  if (fullName) return fullName;

  return String(user.email ?? "Account");
}
