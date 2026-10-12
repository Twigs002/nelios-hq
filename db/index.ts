// Drizzle client. Production uses Neon serverless over HTTP. For local running
// WITHOUT any external service, set DB_DRIVER=pglite to use an embedded
// Postgres (PGlite) persisted to PGLITE_PATH. Both drivers are imported
// statically (no top-level await, so tsx scripts work); PGlite's WASM only
// initialises when the pglite branch actually constructs it.
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

type DB = NeonHttpDatabase<typeof schema>;

function makeDb(): DB {
  if (process.env.DB_DRIVER === "pglite") {
    const path = process.env.PGLITE_PATH || ".pglite";
    return drizzlePglite(new PGlite(path), { schema }) as unknown as DB;
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzleNeon(neon(url), { schema }) as unknown as DB;
}

export const db = makeDb();
export { schema };
