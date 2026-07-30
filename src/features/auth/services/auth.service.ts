import { apiClient } from "@/lib/api/client";
import type {
  AuthUser,
  LoginCredentials,
  RegisterPayload,
} from "../types/auth.types";

// No backend exists yet — these call placeholder endpoints and will throw
// until the API is implemented. LoginForm/RegisterForm already handle the
// rejection as an auth error.

export async function login(
  credentials: LoginCredentials,
): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthUser>("/auth/login", credentials);
  return data;
}

export async function register(
  payload: RegisterPayload,
): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthUser>("/auth/register", payload);
  return data;
}
