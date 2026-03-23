import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  text,
  index,
} from "drizzle-orm/pg-core";
import { teams } from "./teams";

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalId: varchar("external_id", { length: 50 }).notNull().unique(),
    teamId: uuid("team_id").references(() => teams.id),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    nameZh: varchar("name_zh", { length: 100 }),
    position: varchar("position", { length: 10 }),
    jerseyNumber: varchar("jersey_number", { length: 5 }),
    height: varchar("height", { length: 10 }),
    weight: varchar("weight", { length: 10 }),
    isActive: boolean("is_active").notNull().default(true),
    birthDate: varchar("birth_date", { length: 20 }),
    birthCity: varchar("birth_city", { length: 100 }),
    birthCountry: varchar("birth_country", { length: 100 }),
    college: varchar("college", { length: 100 }),
    draftYear: integer("draft_year"),
    draftRound: integer("draft_round"),
    draftNumber: integer("draft_number"),
    experience: integer("experience"),
    salary: integer("salary"),
    nbaDotComPlayerId: integer("nba_dot_com_player_id"),
    photoUrl: text("photo_url"),
  },
  (table) => [index("players_team_id_idx").on(table.teamId)]
);
