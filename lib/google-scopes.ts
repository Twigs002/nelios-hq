// Google OAuth scopes as a config list so adding a scope (e.g. Gmail, later)
// is a one-line change, not a rewrite. calendar.events only for now - the
// narrowest scope that lets us create/update/delete our own follow-up events.
//
// Override via the GOOGLE_SCOPES env var (space-separated) when the time comes.

const DEFAULT_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events",
  // Future (keep in the background - do not enable until the user asks):
  // "https://www.googleapis.com/auth/gmail.compose",
];

export function googleScopes(): string[] {
  const fromEnv = process.env.GOOGLE_SCOPES?.trim();
  return fromEnv ? fromEnv.split(/\s+/).filter(Boolean) : DEFAULT_SCOPES;
}

export const GOOGLE_SCOPE_STRING = googleScopes().join(" ");
