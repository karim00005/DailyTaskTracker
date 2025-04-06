CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  unitOfMeasure TEXT,
  category TEXT,
  costPrice REAL,
  sellPrice1 REAL,
  sellPrice2 REAL,
  sellPrice3 REAL,
  stockQuantity REAL,
  reorderLevel REAL,
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);