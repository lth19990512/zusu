import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  pgEnum,
  index,
  decimal,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { teams } from "./teams";
import { seasons } from "./seasons";
import { players } from "./players";

export const gameStatusEnum = pgEnum("game_status", [
  "scheduled",
  "live",
  "final",
  "postponed",
]);

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalId: varchar("external_id", { length: 50 }).notNull().unique(),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id),
    homeTeamId: uuid("home_team_id")
      .notNull()
      .references(() => teams.id),
    awayTeamId: uuid("away_team_id")
      .notNull()
      .references(() => teams.id),
    status: gameStatusEnum("status").notNull().default("scheduled"),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    homeScore: integer("home_score").notNull().default(0),
    awayScore: integer("away_score").notNull().default(0),
    period: integer("period").notNull().default(0),
    clock: varchar("clock", { length: 10 }),
    venue: varchar("venue", { length: 200 }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("games_start_time_idx").on(table.startTime),
    index("games_home_team_idx").on(table.homeTeamId),
    index("games_away_team_idx").on(table.awayTeamId),
    index("games_status_idx").on(table.status),
    index("games_start_status_idx").on(table.startTime, table.status),
  ]
);

export const gameTeamStats = pgTable(
  "game_team_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    fgm: integer("fgm"),
    fga: integer("fga"),
    fgPct: decimal("fg_pct", { precision: 5, scale: 3 }),
    fg3m: integer("fg3m"),
    fg3a: integer("fg3a"),
    fg3Pct: decimal("fg3_pct", { precision: 5, scale: 3 }),
    ftm: integer("ftm"),
    fta: integer("fta"),
    ftPct: decimal("ft_pct", { precision: 5, scale: 3 }),
    offReb: integer("off_reb"),
    defReb: integer("def_reb"),
    rebounds: integer("rebounds"),
    assists: integer("assists"),
    steals: integer("steals"),
    blocks: integer("blocks"),
    turnovers: integer("turnovers"),
    personalFouls: integer("personal_fouls"),
    points: integer("points"),
    fastBreakPoints: integer("fast_break_points"),
    pointsInPaint: integer("points_in_paint"),
    benchPoints: integer("bench_points"),
  },
  (table) => [
    unique("game_team_stats_unique").on(table.gameId, table.teamId),
  ]
);

export const gamePlayerStats = pgTable(
  "game_player_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    minutes: varchar("minutes", { length: 10 }),
    points: integer("points"),
    rebounds: integer("rebounds"),
    assists: integer("assists"),
    steals: integer("steals"),
    blocks: integer("blocks"),
    turnovers: integer("turnovers"),
    fgm: integer("fgm"),
    fga: integer("fga"),
    fgPct: decimal("fg_pct", { precision: 5, scale: 3 }),
    fg3m: integer("fg3m"),
    fg3a: integer("fg3a"),
    fg3Pct: decimal("fg3_pct", { precision: 5, scale: 3 }),
    ftm: integer("ftm"),
    fta: integer("fta"),
    ftPct: decimal("ft_pct", { precision: 5, scale: 3 }),
    plusMinus: integer("plus_minus"),
    starter: boolean("starter").notNull().default(false),
    personalFouls: integer("personal_fouls"),
    offReb: integer("off_reb"),
    defReb: integer("def_reb"),
  },
  (table) => [
    unique("game_player_stats_unique").on(table.gameId, table.playerId),
    index("game_player_stats_game_idx").on(table.gameId),
    index("game_player_stats_player_idx").on(table.playerId),
  ]
);
