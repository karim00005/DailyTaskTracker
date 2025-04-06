const Database = require('better-sqlite3');
const db = new Database('local.db');

const runMigrations = () => {
  try {
    // Run the first migration
    db.exec(`ALTER TABLE clients ADD COLUMN balance REAL DEFAULT 0 NOT NULL;`);
    console.log("Migration 0001 executed successfully.");

    // Run the second migration
    db.exec(`ALTER TABLE clients ADD COLUMN balance REAL NOT NULL DEFAULT 0;`);
    console.log("Migration 0002 executed successfully.");
  } catch (error) {
    console.error("Error running migrations:", error);
  } finally {
    db.close();
  }
};

runMigrations();
