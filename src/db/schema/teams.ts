import {
  pgTable,
  uuid,
  varchar,
  text,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const conferenceEnum = pgEnum("conference", ["East", "West"]);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalId: varchar("external_id", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    nameZh: varchar("name_zh", { length: 100 }).notNull(),
    abbreviation: varchar("abbreviation", { length: 5 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    conference: conferenceEnum("conference").notNull(),
    division: varchar("division", { length: 50 }).notNull(),
    logoUrl: text("logo_url"),
    primaryColor: varchar("primary_color", { length: 7 }),
    secondaryColor: varchar("secondary_color", { length: 7 }),
  },
  (table) => [index("teams_conference_idx").on(table.conference)]
);
