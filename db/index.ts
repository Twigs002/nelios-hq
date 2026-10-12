// Drizzle client. Production uses Neon serverless over HTTP. For local running
// WITHOUT any external service, set DB_DRIVER=pglite to use an embedded
// Postgres (PGlite) persisted to PGLITE_PATH. Both drivers are imported
// statically (no top-level await, so tsx scripts work); PGlite's WASM only
// initialises when the pglite branch actually constructs it.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

type DB = NeonHttpDatabase<typeof schema>;

function makeDb(): DB {
  // Public DEMO: load a pre-seeded PGlite dump IN-MEMORY per instance. Reads
  // show the fictional seed data; writes are ephemeral. No external service.
  if (process.env.DEMO_DB === "true") {
    const buf = readFileSync(join(process.cwd(), "db/demo-seed.tar.gz"));
    const pg = new PGlite({ loadDataDir: new Blob([buf]) });
    return drizzlePglite(pg, { schema }) as unknown as DB;
  }
  // Local run: embedded PGlite persisted to disk.
  if (process.env.DB_DRIVER === "pglite") {
    const path = process.env.PGLITE_PATH || ".pglite";
    return drizzlePglite(new PGlite(path), { schema }) as unknown as DB;
  }
  // Production: Neon serverless over HTTP.
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzleNeon(neon(url), { schema }) as unknown as DB;
}

export const db = makeDb();
export { schema };
