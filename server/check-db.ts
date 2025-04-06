import { db } from './db';
import { sql } from 'drizzle-orm';
import { 
  users, clients, products, warehouses, settings 
} from '@shared/schema';

async function checkDatabase() {
  try {
    // 1. Check all tables exist
    const tables = await db.all<{name: string}>(
      sql`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
    );
    console.log('Tables in database:');
    console.table(tables);

    // 2. Check migrations were recorded
    const migrations = await db.all<{id: number, name: string}>(
      sql`SELECT id, name FROM drizzle_migrations ORDER BY id`
    );
    console.log('\nApplied migrations:');
    console.table(migrations);

    // 3. Verify each table has data
    const tablesToCheck = [users, clients, products, warehouses, settings];
    for (const table of tablesToCheck) {
      const count = await db.get<{count: number}>(
        sql`SELECT COUNT(*) as count FROM ${table}`
      );
      console.log(`\nTable ${table._.name} has ${count?.count || 0} rows`);
    }

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    process.exit(0);
  }
}

checkDatabase();