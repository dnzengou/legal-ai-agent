import { getDb } from "../api/queries/connection";
import { sql } from "drizzle-orm";

async function reset() {
  const db = getDb();
  // Disable foreign key checks temporarily
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  
  const tables = [
    "activityLog", "ethicalReviews", "reports", "contractReviews", 
    "analyses", "judgments", "statutes", "precedents", 
    "documents", "aiEngines", "users",
  ];
  
  for (const table of tables) {
    try {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS \`${table}\``));
      console.log(`Dropped ${table}`);
    } catch (e) {
      console.log(`Note: ${table} may not exist`);
    }
  }
  
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
  console.log("Database reset complete");
}

reset().catch(console.error);
