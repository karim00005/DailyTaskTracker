import { db } from "../server/db";

export async function up() {
  await db.run(`
    ALTER TABLE clients ADD COLUMN balance REAL DEFAULT 0;
  `);
}

export async function down() {
  await db.run(`
    ALTER TABLE clients DROP COLUMN balance;
  `);
}
