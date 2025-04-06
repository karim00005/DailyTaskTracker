import { db } from './db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get correct directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('Running database migrations...');

  // Check multiple possible locations
  const possiblePaths = [
    path.join(__dirname, '../drizzle/migrations'),   // If server is in /server
    path.join(__dirname, '../../drizzle/migrations'), // If server is in /src/server
    path.join(process.cwd(), 'drizzle/migrations'),   // Root drizzle folder
    path.join(process.cwd(), 'migrations')            // Root migrations folder
  ];

  // Find the first existing migrations directory
  let migrationsDir = '';
  for (const dir of possiblePaths) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      migrationsDir = dir;
      break;
    }
  }

  if (!migrationsDir) {
    throw new Error(`Could not find migrations directory. Checked:\n${possiblePaths.join('\n')}`);
  }

  console.log(`Found migrations at: ${migrationsDir}`);

  // Create migrations table if not exists
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const alreadyRun = await db.get<{id: number}>(
      sql`SELECT id FROM drizzle_migrations WHERE name = ${file}`
    );
    
    if (alreadyRun) {
      console.log(`Skipping already executed: ${file}`);
      continue;
    }

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
}

export async function migrateDatabase() {
  try {
    await runMigrations();
    console.log('Migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}