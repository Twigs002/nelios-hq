// Email allowlist. Everyone not on the list is refused at sign-in and by
// middleware. Edge-safe (no DB, no Node APIs): just env parsing.
//
// Demo safety: on the public demo (DEMO_DB=true) the allowlist is a set of
// clearly-fake personas, never the real ALLOWED_EMAILS, so the demo sign-in
// page never exposes real people's addresses.

// Fake personas for the public demo. Reserved .test TLD, obviously not real.
const DEMO_EMAILS = [
  "nelio@demo.test",
  "claire@demo.test",
  "viewer@demo.test",
];

function isDemo(): boolean {
  return process.env.DEMO_DB === "true";
}

export function allowedEmails(): string[] {
  if (isDemo()) return DEMO_EMAILS;
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = allowedEmails();
  // If the list is empty, refuse everyone (fail closed).
  return list.length > 0 && list.includes(email.trim().toLowerCase());
}

/**
 * Whether the password-less dev sign-in is active. It is allowed ONLY against
 * an embedded database (the in-memory demo, or a local PGlite file) and never
 * against a real deployment, even if AUTH_DEV_LOGIN is left on by mistake. This
 * stops the demo's open sign-in from ever becoming a back door to real seller
 * data on a Neon-backed project.
 */
export function devLoginEnabled(): boolean {
  return (
    process.env.AUTH_DEV_LOGIN === "true" &&
    (process.env.DEMO_DB === "true" || process.env.DB_DRIVER === "pglite")
  );
}
