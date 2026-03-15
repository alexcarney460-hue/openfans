import postgres from "postgres";

const sql = postgres("postgresql://postgres:OpenFans2026Secure@db.qnomimlnkjutldxuxuqj.supabase.co:5432/postgres", {
  ssl: "require",
});

const userId = "d84c6eb8-ccf3-41c0-bdd4-5cabe7e6933f";

try {
  // Add fee_override column first
  await sql.unsafe(`ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS fee_override INTEGER DEFAULT NULL`);
  console.log("Added fee_override column");

  // Set Selena as Founder #1 with 0% fee override
  await sql.unsafe(`
    UPDATE creator_profiles
    SET is_founder = true, founder_number = 1, fee_override = 0
    WHERE user_id = '${userId}'
  `);
  console.log("Set cherryberries as Founder #1, fee_override = 0%");

  // Verify
  const result = await sql.unsafe(`
    SELECT user_id, is_founder, founder_number, fee_override
    FROM creator_profiles WHERE user_id = '${userId}'
  `);
  console.log("Verified:", result[0]);
} catch (err) {
  console.error("Error:", err.message);
}

await sql.end();
