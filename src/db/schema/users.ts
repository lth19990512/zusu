import {
  pgTable,
  pgSequence,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "mod", "admin"]);

// Auto-incrementing sequence for user numbers (0001, 0002, ...)
export const userNumberSeq = pgSequence("user_number_seq", {
  startWith: 1,
  increment: 1,
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // displayName: user-chosen name, e.g. "球迷阿明" (2-20 chars, profanity filtered)
  displayName: varchar("display_name", { length: 50 }).notNull(),
  // userNumber: auto-assigned, displayed as #0042
  userNumber: integer("user_number").notNull().unique(),
  avatarUrl: text("avatar_url"),
  locale: varchar("locale", { length: 10 }).notNull().default("zh-TW"),
  role: userRoleEnum("role").notNull().default("user"),
  isBanned: boolean("is_banned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
