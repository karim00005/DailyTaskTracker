CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit_of_measure TEXT NOT NULL,
  category TEXT,
  cost_price REAL NOT NULL,
  sell_price_1 REAL NOT NULL,
  sell_price_2 REAL,
  sell_price_3 REAL,
  stock_quantity REAL NOT NULL DEFAULT 0,
  reorder_level REAL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);