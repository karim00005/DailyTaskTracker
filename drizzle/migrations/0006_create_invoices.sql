-- drizzle/0006_create_invoices.sql
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT NOT NULL,
  invoice_type TEXT NOT NULL,
  client_id INTEGER NOT NULL,
  warehouse_id INTEGER,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  total REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  grand_total REAL NOT NULL,
  paid REAL NOT NULL DEFAULT 0,
  balance REAL NOT NULL,
  notes TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL
);