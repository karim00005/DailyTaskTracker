import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Create a connection to the database
const connectionString = process.env.DATABASE_URL;

// Create a postgres client
const client = postgres(connectionString!);

// Create a drizzle instance
export const db = drizzle(client, { schema });