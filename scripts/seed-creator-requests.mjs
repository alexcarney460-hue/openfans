import postgres from "postgres";

const DATABASE_URL =
  "postgresql://postgres:OpenFans2026Secure@db.qnomimlnkjutldxuxuqj.supabase.co:5432/postgres";

const sql = postgres(DATABASE_URL, { ssl: "require" });

// 10 popular creators with realistic request counts
const CREATORS = [
  { name: "Belle Delphine", username: "belledelphine", requests: 28 },
  { name: "Amouranth", username: "amaborata", requests: 24 },
  { name: "Hannah Owo", username: "hannahowo", requests: 19 },
  { name: "Corinna Kopf", username: "corinnakopf", requests: 22 },
  { name: "Bhad Bhabie", username: "bhadbhabie", requests: 15 },
  { name: "Iggy Azalea", username: "iggyazalea", requests: 12 },
  { name: "Tyga", username: "tyga", requests: 9 },
  { name: "Carolina Rose", username: "caborose", requests: 17 },
  { name: "Christine Quinn", username: "thechristinequinn", requests: 7 },
  { name: "Sierra Skye", username: "sierraskyeofficial", requests: 5 },
];

// Generate a fake email for each request
function fakeEmail(creatorIndex, requestIndex) {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "protonmail.com"];
  const domain = domains[requestIndex % domains.length];
  return `fan${creatorIndex * 100 + requestIndex + 1}@${domain}`;
}

async function seed() {
  console.log("Seeding creator requests...");

  let totalInserted = 0;

  for (let ci = 0; ci < CREATORS.length; ci++) {
    const creator = CREATORS[ci];
    console.log(`  ${creator.name} (@${creator.username}) - ${creator.requests} requests`);

    for (let ri = 0; ri < creator.requests; ri++) {
      const email = fakeEmail(ci, ri);
      try {
        await sql`
          INSERT INTO creator_requests (creator_name, platform, platform_username, requested_by_email)
          VALUES (${creator.name}, 'onlyfans', ${creator.username}, ${email})
          ON CONFLICT DO NOTHING
        `;
        totalInserted++;
      } catch (err) {
        // Skip duplicates silently
        if (!err.message.includes("duplicate") && !err.message.includes("unique")) {
          console.error(`    Error for ${email}: ${err.message}`);
        }
      }
    }
  }

  console.log(`Done. Inserted ${totalInserted} creator request rows.`);

  // Show summary
  const summary = await sql`
    SELECT platform_username, creator_name, COUNT(*) AS cnt
    FROM creator_requests
    GROUP BY platform_username, creator_name
    ORDER BY cnt DESC
  `;
  console.log("\nCurrent request counts:");
  for (const row of summary) {
    console.log(`  ${row.creator_name} (@${row.platform_username}): ${row.cnt} requests`);
  }

  await sql.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
