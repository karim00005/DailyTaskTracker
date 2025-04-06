import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./db";

// This will automatically run needed migrations on the database
export const migrateDatabase = async () => {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" }); // Ensure migrations folder is used
  console.log("Migrations completed");
};
