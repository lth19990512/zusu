import { neon } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Database = NeonHttpDatabase<typeof schema>;

function createDb(): Database {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Please configure your Neon PostgreSQL connection string."
    );
  }
  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql, { schema });
}

// Lazy singleton — only connects when first accessed at runtime
let _db: Database | null = null;

function getDb(): Database {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

// Proxy that lazily initializes on first property access
export const db = new Proxy({} as Database, {
  get(_, prop) {
    const instance = getDb();
    const value = instance[prop as keyof Database];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
