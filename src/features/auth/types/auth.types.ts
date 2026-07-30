export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Mirrors the RBAC roles defined in CONTEXT.md.
export type UserRole = "administrator" | "media_operator" | "viewer";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
