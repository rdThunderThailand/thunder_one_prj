import { apiClient } from "@/lib/api/client";
import type {
  LoginCredentials,
  RegisterPayload,
} from "../types/auth.types";

export async function login(
  credentials: LoginCredentials,
): Promise<{ userId: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    throw new Error("Invalid email or password.");
  }

  const data = await res.json();
  return data;
}

// No backend exists yet — this calls placeholder endpoints and will throw
// until the API is implemented. RegisterForm already handles the rejection.

export async function register(payload: RegisterPayload): Promise<void> {
  await apiClient.post("/auth/register", payload);
}
