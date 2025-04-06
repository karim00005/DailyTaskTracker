import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  driver: "sqlite", // Use a compatible driver
  dialect: "sqlite",
  dbCredentials: {
    url: "./db.sqlite"
  },
  out: "./drizzle",
} satisfies Config;
