import { db } from "@/db";
import { teams, players, games, gameTeamStats, gamePlayerStats } from "@/db/schema";
import { getBoxScoresByDate } from "@/lib/sportsdata";
import { normalizeTeamGameStats, normalizePlayerGameStats } from "./normalizer";
import { sql, eq } from "drizzle-orm";
import { redis } from "@/lib/redis";

async function getTeamIdMap(): Promise<Map<string, string>> {
  const allTeams = await db
    .select({ id: teams.id, externalId: teams.externalId })
    .from(teams);
  return new Map(allTeams.map((t) => [t.externalId, t.id]));
}

async function getPlayerIdMap(): Promise<Map<string, string>> {
  const allPlayers = await db
    .select({ id: players.id, externalId: players.externalId })
    .from(players);
  return new Map(allPlayers.map((p) => [p.externalId, p.id]));
}

async function getGameIdMap(
  externalIds: string[]
): Promise<Map<string, string>> {
  if (externalIds.length === 0) return new Map();
  const allGames = await db
    .select({ id: games.id, externalId: games.externalId })
    .from(games)
    .where(sql`${games.externalId} = ANY(${externalIds})`);
  return new Map(allGames.map((g) => [g.externalId, g.id]));
}

export async function syncBoxScores(date: Date) {
  const teamIdMap = await getTeamIdMap();
  const playerIdMap = await getPlayerIdMap();
  const rawBoxScores = await getBoxScoresByDate(date);

  if (rawBoxScores.length === 0) {
    return { synced: 0 };
  }

  const gameExternalIds = rawBoxScores.map((bs) => String(bs.Game.GameID));
  const gameIdMap = await getGameIdMap(gameExternalIds);

  let synced = 0;

  for (const bs of rawBoxScores) {
    const gameExternalId = String(bs.Game.GameID);
    const gameId = gameIdMap.get(gameExternalId);
    if (!gameId) continue;

    // Upsert team stats
    for (const tg of bs.TeamGames) {
      const data = normalizeTeamGameStats(tg, gameId, teamIdMap);
      if (!data.teamId) continue;

      await db
        .insert(gameTeamStats)
        .values(data)
        .onConflictDoUpdate({
          target: [gameTeamStats.gameId, gameTeamStats.teamId],
          set: {
            fgm: sql`excluded.fgm`,
            fga: sql`excluded.fga`,
            fgPct: sql`excluded.fg_pct`,
            fg3m: sql`excluded.fg3m`,
            fg3a: sql`excluded.fg3a`,
            fg3Pct: sql`excluded.fg3_pct`,
            ftm: sql`excluded.ftm`,
            fta: sql`excluded.fta`,
            ftPct: sql`excluded.ft_pct`,
            offReb: sql`excluded.off_reb`,
            defReb: sql`excluded.def_reb`,
            rebounds: sql`excluded.rebounds`,
            assists: sql`excluded.assists`,
            steals: sql`excluded.steals`,
            blocks: sql`excluded.blocks`,
            turnovers: sql`excluded.turnovers`,
            personalFouls: sql`excluded.personal_fouls`,
            points: sql`excluded.points`,
          },
        });
    }

    // Upsert player stats
    for (const pg of bs.PlayerGames) {
      const playerId = playerIdMap.get(String(pg.PlayerID));
      if (!playerId) continue;

      const data = normalizePlayerGameStats(pg, gameId, teamIdMap, playerIdMap);
      if (!data.playerId || !data.teamId) continue;

      await db
        .insert(gamePlayerStats)
        .values(data)
        .onConflictDoUpdate({
          target: [gamePlayerStats.gameId, gamePlayerStats.playerId],
          set: {
            minutes: sql`excluded.minutes`,
            points: sql`excluded.points`,
            rebounds: sql`excluded.rebounds`,
            assists: sql`excluded.assists`,
            steals: sql`excluded.steals`,
            blocks: sql`excluded.blocks`,
            turnovers: sql`excluded.turnovers`,
            fgm: sql`excluded.fgm`,
            fga: sql`excluded.fga`,
            fgPct: sql`excluded.fg_pct`,
            fg3m: sql`excluded.fg3m`,
            fg3a: sql`excluded.fg3a`,
            fg3Pct: sql`excluded.fg3_pct`,
            ftm: sql`excluded.ftm`,
            fta: sql`excluded.fta`,
            ftPct: sql`excluded.ft_pct`,
            plusMinus: sql`excluded.plus_minus`,
            starter: sql`excluded.starter`,
          },
        });
    }

    // Cache box score in Redis
    await redis.set(`boxscore:${gameId}`, JSON.stringify(bs), { ex: 60 });

    synced++;
  }

  return { synced };
}
