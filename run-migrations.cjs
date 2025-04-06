const Database = require('better-sqlite3');
const db = new Database('local.db');

const runMigrations = async () => {
  try {
    // Check if the balance column exists
    const columnExists = db.prepare(`PRAGMA table_info(clients);`).all().some(col => col.name === 'balance');
    
    if (!columnExists) {
      // Run the first migration
      db.exec(`ALTER TABLE clients ADD COLUMN balance REAL DEFAULT 0 NOT NULL;`);
      console.log("Migration 0001 executed successfully.");
    } else {
      console.log("Migration 0001 skipped: 'balance' column already exists.");
    }

    // Check if the balance column exists again
    const columnExistsAgain = db.prepare(`PRAGMA table_info(clients);`).all().some(col => col.name === 'balance');
    
    if (!columnExistsAgain) {
      // Run the second migration
      db.exec(`ALTER TABLE clients ADD COLUMN balance REAL NOT NULL DEFAULT 0;`);
      console.log("Migration 0002 executed successfully.");
    } else {
      console.log("Migration 0002 skipped: 'balance' column already exists.");
    }
  } catch (error) {
    console.error("Error running migrations:", error);
  } finally {
    db.close();
  }
};

runMigrations();
