import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  boolean,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { games } from "./games";
import { players } from "./players";
import { teams } from "./teams";

export const shots = pgTable(
  "shots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalPlayId: varchar("external_play_id", { length: 50 }).notNull(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),

    // Coordinates (0-100 percentage from SportsData API)
    baselineOffsetPct: decimal("baseline_offset_pct", {
      precision: 6,
      scale: 3,
    }),
    sidelineOffsetPct: decimal("sideline_offset_pct", {
      precision: 6,
      scale: 3,
    }),

    // Pre-computed zone for fast aggregation
    zoneId: varchar("zone_id", { length: 30 }).notNull(),

    // Shot outcome
    made: boolean("made").notNull(),

    // Shot metadata
    shotType: varchar("shot_type", { length: 50 }),
    shotDistance: decimal("shot_distance", { precision: 5, scale: 1 }),

    // Game context
    quarter: varchar("quarter", { length: 5 }).notNull(),
    timeRemainingMinutes: integer("time_remaining_minutes"),
    timeRemainingSeconds: integer("time_remaining_seconds"),
    sequence: integer("sequence").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("shots_external_play_unique").on(table.externalPlayId, table.gameId),
    index("shots_player_idx").on(table.playerId),
    index("shots_game_idx").on(table.gameId),
    index("shots_player_zone_idx").on(table.playerId, table.zoneId),
    index("shots_team_idx").on(table.teamId),
  ]
);
