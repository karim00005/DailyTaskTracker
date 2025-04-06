CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  website TEXT,
  tax_number TEXT,
  currency TEXT NOT NULL DEFAULT 'جنيه مصري',
  currency_symbol TEXT NOT NULL DEFAULT 'ج.م',
  decimal_places INTEGER NOT NULL DEFAULT 2,
  backup_path TEXT,
  cloud_backup_path TEXT
);