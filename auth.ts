// Full Auth.js (Node runtime). Extends the edge-safe config with token
// persistence so the server can act for Nelio later (calendar sync, cron).
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { db } from "@/db";
import { googleAccounts } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, account, profile }) {
      // On initial Google sign-in, persist the tokens (incl. refresh token).
      // The dev-login provider has no Google account, so skip it.
      if (account?.provider === "google" && token.email) {
        token.email = token.email ?? profile?.email;
        try {
          await db
            .insert(googleAccounts)
            .values({
              email: String(token.email).toLowerCase(),
              accessToken: account.access_token ?? null,
              refreshToken: account.refresh_token ?? null,
              expiresAt: account.expires_at
                ? new Date(account.expires_at * 1000)
                : null,
              scope: account.scope ?? null,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: googleAccounts.email,
              set: {
                accessToken: account.access_token ?? null,
                // Keep an existing refresh token if Google omits it on re-consent.
                ...(account.refresh_token
                  ? { refreshToken: account.refresh_token }
                  : {}),
                expiresAt: account.expires_at
                  ? new Date(account.expires_at * 1000)
                  : null,
                scope: account.scope ?? null,
                updatedAt: new Date(),
              },
            });
        } catch (err) {
          // Never block sign-in on a token-store hiccup. Do not log PII.
          console.error("google token persist failed");
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = String(token.email);
      }
      return session;
    },
  },
});
