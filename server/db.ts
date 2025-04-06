import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

// Extend the BetterSQLite3Database interface to include the driver property
declare module "drizzle-orm/better-sqlite3" {
  interface BetterSQLite3Database<TSchema extends Record<string, unknown> = Record<string, never>> {
  driver: InstanceType<typeof Database>;
  }
}

const sqlite = new Database("local.db", { verbose: console.log });
export const db: BetterSQLite3Database<typeof schema> = drizzle(sqlite, { schema });

// Expose the underlying database driver
db.driver = sqlite;