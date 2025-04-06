-- drizzle/0007_create_transactions.sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_number TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'قبض' (receipt), 'صرف' (payment)
  client_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  reference TEXT,
  bank TEXT,
  notes TEXT,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);