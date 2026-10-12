// Edge middleware: gate every route via the allowlist-aware `authorized`
// callback. Unauthenticated or non-allowlisted users are redirected to /signin.
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);
export default middleware;

export const config = {
  // Run on everything except static assets and public brand files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|icons/|manifest.webmanifest|sw.js).*)",
  ],
};
