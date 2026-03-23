import {
  pgTable,
  uuid,
  integer,
  date,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

export const seasonTypeEnum = pgEnum("season_type", [
  "regular",
  "playoff",
  "preseason",
]);

export const seasons = pgTable(
  "seasons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    year: integer("year").notNull(),
    type: seasonTypeEnum("type").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
  },
  (table) => [unique("seasons_year_type_unique").on(table.year, table.type)]
);
