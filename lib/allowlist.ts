// Email allowlist. Everyone not on the list is refused at sign-in and by
// middleware. Edge-safe (no DB, no Node APIs): just env parsing.

export function allowedEmails(): string[] {
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
