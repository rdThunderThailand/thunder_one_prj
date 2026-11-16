export const LOGIN_FAILURES = {
  INVALID_CREDENTIALS: { status: 401, message: "Invalid email or password." },
  EMAIL_NOT_CONFIRMED: { status: 403, message: "Please confirm your email before signing in." },
  RATE_LIMITED: { status: 429, message: "Too many requests. Please try again later." },
  AUTH_SERVICE_UNAVAILABLE: { status: 502, message: "Could not sign in right now. Please try again later." },
} as const;

type LoginErrorCode = keyof typeof LOGIN_FAILURES;

export function loginErrorCode(status: number, code: unknown): LoginErrorCode {
  if (status === 429) return "RATE_LIMITED";
  if (status === 401 && code === "INVALID_CREDENTIALS") return "INVALID_CREDENTIALS";
  if (status === 403 && code === "EMAIL_NOT_CONFIRMED") return "EMAIL_NOT_CONFIRMED";
  return "AUTH_SERVICE_UNAVAILABLE";
}

export class LoginError extends Error {
  constructor(code: LoginErrorCode) {
    super(LOGIN_FAILURES[code].message);
    this.name = "LoginError";
  }
}
