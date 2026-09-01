import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("to_at")?.value;
  const { pathname } = request.nextUrl;

  // /set-password: where Supabase's invite email (Add Employee flow) lands
  // an invitee who, by definition, has no session cookie yet — see
  // src/features/auth/components/SetPasswordForm.tsx.
  // /invites/accept: Core's other (pre-existing) invite mechanism — also
  // needs to stay reachable *with* a session (unlike /login/register),
  // since a logged-in visitor accepting-as-themselves or hitting the
  // wrong-account message is a valid, expected case — so it's only added
  // to the "let unauthenticated traffic through" check below, never to the
  // "redirect a token-holder away" one.
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/set-password" ||
    pathname === "/invites/accept";

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Keep /login reachable as the recovery path when a revoked or expired token
  // outlives its cookie. Redirecting on cookie presence alone traps the 401
  // redirect from getSession() in a /login <-> / loop.
  if (token && pathname === "/register") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - /api/* (BFF proxy and auth endpoints must remain accessible without proxy redirect)
     * - /_next/* (Next.js internal static files, scripts, and image optimization assets)
     * - Static asset files (favicon, images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
