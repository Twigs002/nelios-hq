// Produce a pre-seeded PGlite dump (db/demo-seed.tar.gz) from the local
// embedded DB, for the public DEMO deploy. The app loads it in-memory per
// instance (reads work; writes are ephemeral). Regenerate after a seed change.
import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

async function main() {
  const path = process.env.PGLITE_PATH || ".pglite-data";
  const pg = new PGlite(path);
  await pg.waitReady;
  const dump = await pg.dumpDataDir("gzip");
  const buf = Buffer.from(await dump.arrayBuffer());
  await writeFile("db/demo-seed.tar.gz", buf);
  console.log(`wrote db/demo-seed.tar.gz (${(buf.length / 1024).toFixed(0)} KB)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
