CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  companyName TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  website TEXT,
  taxNumber TEXT,
  currency TEXT,
  currencySymbol TEXT,
  decimalPlaces INTEGER,
  backupPath TEXT,
  cloudBackupPath TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);