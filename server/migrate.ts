import { db } from './db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('Running migrations...');

  try {
    // Create migrations directory if it doesn't exist
    const migrationsDir = path.join(__dirname, '../migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir);
      console.log('Created migrations directory');
    }

    // Create migrations tracking table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS drizzle_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('No migration files found');
      return;
    }

    console.log(`Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      console.log(`Executing ${file}...`);
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const statements = content.split(';').filter(s => s.trim());

      for (const stmt of statements) {
        if (stmt) await db.run(sql.raw(stmt));
      }

      await db.run(sql`
        INSERT INTO drizzle_migrations (name) VALUES (${file})
      `);
    }

    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

await runMigrations();