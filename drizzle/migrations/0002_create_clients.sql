CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  account_type TEXT NOT NULL DEFAULT 'مدين',
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);  