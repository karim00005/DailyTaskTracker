import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",  // added schema property
  out: "./drizzle",
  driver: "d1-http",
  dialect: "sqlite", // added dialect parameter
  dbCredentials: {
    databaseId: "local",
    url: "./local.db",
  },
} satisfies Config;
