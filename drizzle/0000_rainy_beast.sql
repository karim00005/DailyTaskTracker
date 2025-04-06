CREATE TABLE `clients` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`balance` real DEFAULT 0 NOT NULL, -- Ensure the balance column exists
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

CREATE TABLE `invoice_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`invoice_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` real NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`tax` real DEFAULT 0 NOT NULL,
	`total` real NOT NULL
);

CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY NOT NULL,
	`invoice_number` text NOT NULL,
	`invoice_type` text NOT NULL,
	`client_id` integer NOT NULL,
	`warehouse_id` integer,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`payment_method` text NOT NULL,
	`user_id` integer NOT NULL,
	`total` real NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`tax` real DEFAULT 0 NOT NULL,
	`grand_total` real NOT NULL,
	`paid` real DEFAULT 0 NOT NULL,
	`balance` real NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL
);

CREATE TABLE `products` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`unit_of_measure` text NOT NULL,
	`category` text,
	`cost_price` real NOT NULL,
	`sell_price_1` real NOT NULL,
	`sell_price_2` real,
	`sell_price_3` real,
	`stock_quantity` real DEFAULT 0 NOT NULL,
	`reorder_level` real,
	`is_active` integer DEFAULT true NOT NULL
);

CREATE TABLE `projects` (
	`id` integer PRIMARY KEY NOT NULL,
	`client_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`start_date` integer,
	`end_date` integer,
	`status` text,
	`budget` integer,
	`notes` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`address` text,
	`phone` text,
	`mobile` text,
	`email` text,
	`website` text,
	`tax_number` text,
	`currency` text DEFAULT 'جنيه مصري' NOT NULL,
	`currency_symbol` text DEFAULT 'ج.م' NOT NULL,
	`decimal_places` integer DEFAULT 2 NOT NULL,
	`backup_path` text,
	`cloud_backup_path` text
);

CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY NOT NULL,
	`project_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`start_date` integer,
	`due_date` integer,
	`status` text,
	`priority` text,
	`assignee` text,
	`notes` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `timesheets` (
	`id` integer PRIMARY KEY NOT NULL,
	`task_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`date` integer NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`duration` integer NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY NOT NULL,
	`transaction_number` text NOT NULL,
	`transaction_type` text NOT NULL,
	`client_id` integer NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`amount` real NOT NULL,
	`payment_method` text NOT NULL,
	`reference` text,
	`bank` text,
	`notes` text,
	`user_id` integer NOT NULL,
	`created_at` integer NOT NULL
);

CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`full_name` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);

CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);

CREATE TABLE `warehouses` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`is_default` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
