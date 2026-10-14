import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { allowedEmails, isAllowed, devLoginEnabled } from "@/lib/allowlist";

// These functions read process.env at call time, so set/clear per test.
const KEYS = ["DEMO_DB", "DB_DRIVER", "AUTH_DEV_LOGIN", "ALLOWED_EMAILS"] as const;
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const k of KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("devLoginEnabled (demo back-door guard)", () => {
  it("is off when the flag is unset", () => {
    expect(devLoginEnabled()).toBe(false);
  });

  it("is OFF even with the flag on, if the DB is not embedded (the real-deploy risk)", () => {
    process.env.AUTH_DEV_LOGIN = "true";
    // No DEMO_DB, no pglite -> a Neon-backed deploy. Must refuse.
    expect(devLoginEnabled()).toBe(false);
  });

  it("is on for the demo", () => {
    process.env.AUTH_DEV_LOGIN = "true";
    process.env.DEMO_DB = "true";
    expect(devLoginEnabled()).toBe(true);
  });

  it("is on for local PGlite dev", () => {
    process.env.AUTH_DEV_LOGIN = "true";
    process.env.DB_DRIVER = "pglite";
    expect(devLoginEnabled()).toBe(true);
  });
});

describe("allowlist", () => {
  it("non-demo uses ALLOWED_EMAILS and fails closed when empty", () => {
    expect(isAllowed("someone@example.com")).toBe(false);
    process.env.ALLOWED_EMAILS = "a@quay1.co.za, B@Quay1.co.za";
    expect(allowedEmails()).toEqual(["a@quay1.co.za", "b@quay1.co.za"]);
    expect(isAllowed("A@quay1.co.za")).toBe(true);
    expect(isAllowed("nope@x.com")).toBe(false);
  });

  it("demo exposes only fake personas, never the real allowlist", () => {
    process.env.DEMO_DB = "true";
    process.env.ALLOWED_EMAILS = "real.person@quay1.co.za";
    const list = allowedEmails();
    expect(list).not.toContain("real.person@quay1.co.za");
    expect(list.every((e) => e.endsWith("@demo.test"))).toBe(true);
    // the real email cannot sign in to the demo; a demo persona can
    expect(isAllowed("real.person@quay1.co.za")).toBe(false);
    expect(isAllowed(list[0])).toBe(true);
  });
});
