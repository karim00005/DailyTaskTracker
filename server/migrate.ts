import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./db";
import { readdirSync } from 'fs';
import { join } from 'path';

// This will automatically run needed migrations on the database
export const migrateDatabase = async () => {
  console.log("Running migrations...");

  const migrationsFolder = "./drizzle";
  const migrationFiles = readdirSync(migrationsFolder);

  if (migrationFiles.length === 0) {
    console.log("No migration files found.");
    return;
  }

  try {
    await migrate(db, { migrationsFolder: migrationsFolder }); // Ensure migrations folder is used
    console.log("Migrations completed");
  } catch (error) {
    console.error("Error running migrations:", error);
  }
};
