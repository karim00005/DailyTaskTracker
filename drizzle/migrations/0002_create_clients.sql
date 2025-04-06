CREATE TABLE `clients` (
  `id` integer PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `balance` real DEFAULT 0 NOT NULL,
  `contact_person` text,
  `email` text,
  `phone` text,
  `address` text,
  `city` text,
  `state` text,
  `zip_code` text,
  `country` text,
  `notes` text,
  `created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
  `updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
