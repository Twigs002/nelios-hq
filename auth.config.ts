// Edge-safe Auth.js config: providers + allowlist + route protection, no DB.
// Imported by middleware (edge) and by the full auth.ts (Node).
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { isAllowed, devLoginEnabled } from "@/lib/allowlist";
import { GOOGLE_SCOPE_STRING } from "@/lib/google-scopes";

const providers: NextAuthConfig["providers"] = [
  Google({
    authorization: {
      params: {
        scope: GOOGLE_SCOPE_STRING,
        access_type: "offline", // ask for a refresh token (cron/calendar)
        prompt: "consent",
      },
    },
  }),
];

// Local-only convenience: sign in as any allowlisted email without Google.
// Enabled ONLY when AUTH_DEV_LOGIN=true AND the DB is embedded (demo/local) -
// see devLoginEnabled(). Never activates against a real Neon deployment.
if (devLoginEnabled()) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev login",
      credentials: { email: { label: "Email", type: "email" } },
      authorize(creds) {
        const email = typeof creds?.email === "string" ? creds.email.trim().toLowerCase() : "";
        return isAllowed(email) ? { id: email, email, name: email.split("@")[0] } : null;
      },
    }),
  );
}

export const authConfig = {
  trustHost: true,
  // Pin secure-cookie mode to the deployment protocol so the edge middleware
  // and the Node routes agree on the cookie name (https -> __Secure- prefix).
  // Keyed off AUTH_URL: https locally-or-deployed uses secure; http does not.
  useSecureCookies: !!process.env.AUTH_URL?.startsWith("https://"),
  pages: { signIn: "/signin" },
  providers,
  callbacks: {
    // Allowlist gate. Refuse anyone not listed in ALLOWED_EMAILS.
    signIn({ user }) {
      return isAllowed(user?.email);
    },
    // Route protection for middleware. Public: /signin and the auth API.
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === "/signin" ||
        pathname === "/offline" ||
        pathname === "/icon" ||
        pathname === "/apple-icon" ||
        pathname === "/manifest.webmanifest" ||
        pathname.startsWith("/api/auth") ||
        pathname === "/api/cron/digest" || // guarded by CRON_SECRET in the route
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico";
      if (isPublic) return true;
      return !!auth?.user && isAllowed(auth.user.email);
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
