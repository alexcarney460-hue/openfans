import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "migrations");

const sql = postgres("postgresql://postgres:OpenFans2026Secure@db.qnomimlnkjutldxuxuqj.supabase.co:5432/postgres", {
  ssl: "require",
});

async function run() {
  console.log("Connected to database");

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql") && !f.startsWith("_"))
    .sort();

  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`Running ${file}...`);
    try {
      await sql.unsafe(content);
      console.log(`  OK`);
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
    }
  }

  await sql.end();
  console.log("Done");
}

run().catch(console.error);
