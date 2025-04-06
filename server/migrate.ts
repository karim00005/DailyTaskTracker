import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./db";
import { readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const currentDir = dirname(fileURLToPath(import.meta.url));

export const migrateDatabase = async () => {
  console.log("Running migrations...");

  try {
    // Use path.join with the current directory
    const migrationsDir = join(currentDir, '../drizzle/migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      console.log(`Executing migration ${file}...`);

      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        try {
          await db.run(statement);
          console.log(`Executed statement from ${file}`);
        } catch (error: any) {
          if (!error.message?.includes('already exists')) {
            console.error(`Error executing migration ${file}:`, error);
            throw error;
          }
          console.log(`Table in ${file} already exists, skipping...`);
        }
      }
    }

    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  }
};
