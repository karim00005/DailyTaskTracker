DROP TABLE IF EXISTS `clients`;
CREATE TABLE `clients` (
    `id` INTEGER PRIMARY KEY NOT NULL,
    `name` TEXT NOT NULL,
    `balance` REAL NOT NULL DEFAULT 0,
    `type` TEXT DEFAULT 'عميل',
    `accountType` TEXT DEFAULT 'جاري',
    `code` TEXT,
    `taxId` TEXT,
    `address` TEXT,
    `city` TEXT,
    `phone` TEXT,
    `mobile` TEXT,
    `email` TEXT,
    `notes` TEXT,
    `isActive` INTEGER DEFAULT 1,
    `createdAt` INTEGER DEFAULT (unixepoch())
);
// ...existing code for other tables...
