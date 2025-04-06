import { db } from './db';
import { sql } from 'drizzle-orm';
import { users, clients, products, warehouses, settings, invoices } from '../shared/schema';
import Database from "better-sqlite3";

async function ensureTablesExist() {
  // Verify each required table exists
  const requiredTables = [
    { name: 'users', schema: users },
    { name: 'clients', schema: clients },
    { name: 'products', schema: products },
    { name: 'warehouses', schema: warehouses },
    { name: 'settings', schema: settings },
    { name: 'invoices', schema: invoices }
  ];

  for (const table of requiredTables) {
    try {
      // Use the underlying BetterSQLite3 driver via db.driver
      const result: { name: string }[] = (db.driver as Database)
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
        .all(table.name) as { name: string }[];
      if (!result.length) {
        throw new Error(`Table ${table.name} does not exist`);
      }
    } catch (error) {
      console.error(`Table verification failed for ${table.name}:`, error);
      throw error;
    }
  }
}

export async function initializeDatabase() {
  try {
    console.log("Initializing database with default data...");
    await ensureTablesExist();

    // Insert default data
    await db.transaction(async (tx) => {
      // Check if admin user exists
      const adminExists = await tx.select().from(users)
        .where(sql`username = 'admin'`)
        .get();
      
      if (!adminExists) {
        await tx.insert(users).values({
          username: 'admin',
          password: 'admin123', // In production, use hashed passwords!
          fullName: 'System Administrator',
          role: 'admin',
          is_active: 1
        });
        console.log("Created default admin user");
      }

      // Add other default data checks here...
    });

    console.log("Database initialization completed successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}