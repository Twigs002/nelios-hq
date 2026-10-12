import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Migrations run against the unpooled (direct) Neon connection when available.
// A placeholder keeps offline `drizzle-kit generate` working with no DB;
// `migrate`/`push` need the real connection string in the environment.
const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
