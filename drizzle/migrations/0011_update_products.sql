DROP TABLE IF EXISTS products;

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
    stock_quantity REAL DEFAULT 0 NOT NULL,
    reorder_level REAL,
    is_active INTEGER DEFAULT 1 NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category);
