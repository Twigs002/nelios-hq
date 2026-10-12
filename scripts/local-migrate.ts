// Apply Drizzle migrations to the local embedded Postgres (PGlite).
// Used only for local running; production uses Neon + drizzle-kit migrate.
import "dotenv/config";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

async function main() {
  const path = process.env.PGLITE_PATH || ".pglite";
  const db = drizzle(new PGlite(path));
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log(`PGlite migrated at ${path}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
