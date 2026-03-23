import { db } from "@/db";
import { teams, games, seasons } from "@/db/schema";
import { getScoresByDate } from "@/lib/sportsdata";
import { normalizeGame } from "./normalizer";
import { sql, eq, and } from "drizzle-orm";
import { redis } from "@/lib/redis";

async function getTeamIdMap(): Promise<Map<string, string>> {
  const allTeams = await db
    .select({ id: teams.id, externalId: teams.externalId })
    .from(teams);
  return new Map(allTeams.map((t) => [t.externalId, t.id]));
}

async function getOrCreateSeason(year: number, type: string): Promise<string> {
  const seasonType =
    type === "1"
      ? "preseason"
      : type === "3"
        ? "playoff"
        : "regular";

  const [existing] = await db
    .select({ id: seasons.id })
    .from(seasons)
    .where(and(eq(seasons.year, year), eq(seasons.type, seasonType as "regular" | "playoff" | "preseason")))
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(seasons)
    .values({
      year,
      type: seasonType as "regular" | "playoff" | "preseason",
      startDate: `${year}-10-01`,
    })
    .returning({ id: seasons.id });

  return created.id;
}

export async function syncScores(date: Date) {
  const teamIdMap = await getTeamIdMap();
  const rawGames = await getScoresByDate(date);

  if (rawGames.length === 0) {
    return { synced: 0, live: 0 };
  }

  // Get or create season
  const firstGame = rawGames[0];
  const seasonId = await getOrCreateSeason(
    firstGame.Season,
    String(firstGame.SeasonType)
  );

  let live = 0;

  for (const raw of rawGames) {
    const data = normalizeGame(raw, teamIdMap, seasonId);

    await db
      .insert(games)
      .values(data)
      .onConflictDoUpdate({
        target: games.externalId,
        set: {
          status: sql`excluded.status`,
          homeScore: sql`excluded.home_score`,
          awayScore: sql`excluded.away_score`,
          period: sql`excluded.period`,
          clock: sql`excluded.clock`,
          updatedAt: sql`now()`,
        },
      });

    if (data.status === "live") live++;
  }

  // Cache today's scoreboard in Redis (30s TTL)
  const dateStr = date.toISOString().split("T")[0];
  const cacheKey = `scoreboard:${dateStr}`;

  // Fetch all games for today from DB with team info for the cache
  const todayGames = await db
    .select()
    .from(games)
    .innerJoin(teams, eq(games.homeTeamId, teams.id))
    .where(
      sql`DATE(${games.startTime} AT TIME ZONE 'America/New_York') = ${dateStr}`
    );

  if (todayGames.length > 0) {
    await redis.set(cacheKey, JSON.stringify(todayGames), { ex: 30 });
  }

  return { synced: rawGames.length, live };
}
