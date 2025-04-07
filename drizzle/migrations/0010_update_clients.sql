-- Drop existing table
DROP TABLE IF EXISTS clients;

-- Create new table with correct column names
CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    client_type TEXT DEFAULT 'عميل',
    account_type TEXT DEFAULT 'مدين' NOT NULL,
    code TEXT,
    tax_id TEXT,
    balance REAL DEFAULT 0 NOT NULL,
    address TEXT,
    city TEXT,
    phone TEXT,
    mobile TEXT,
    email TEXT,
    notes TEXT,
    is_active INTEGER DEFAULT 0 NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
);

-- Add index for common queries
CREATE INDEX idx_clients_code ON clients(code);
CREATE INDEX idx_clients_name ON clients(name);
