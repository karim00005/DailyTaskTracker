CREATE TABLE `users` (
  `id` integer PRIMARY KEY NOT NULL,
  `username` text NOT NULL,
  `password` text NOT NULL,
  `full_name` text NOT NULL,
  `role` text DEFAULT 'user' NOT NULL,
  `is_active` integer DEFAULT true NOT NULL
);

CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
