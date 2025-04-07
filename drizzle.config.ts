import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: "sqlite",
  dbCredentials: {
    url: "./db.sqlite", // This is your SQLite database file
  },
} satisfies Config;
