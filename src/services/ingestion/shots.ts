import { db } from "@/db";
import { teams, players, games, shots } from "@/db/schema";
import { getPlayByPlay } from "@/lib/sportsdata";
import { apiCoordsToSvg, classifyShot } from "@/lib/shot-chart-utils";
import { sql, eq, and } from "drizzle-orm";

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

/** Extract shot type from play description, e.g. "makes 18-foot jumper" → "Jumper" */
function parseShotType(description: string, type: string): string {
  if (type.includes("Dunk")) return "Dunk";
  if (type.includes("Layup")) return "Layup";

  const lower = description.toLowerCase();
  if (lower.includes("dunk")) return "Dunk";
  if (lower.includes("layup")) return "Layup";
  if (lower.includes("hook")) return "Hook";
  if (lower.includes("tip")) return "Tip-In";
  if (lower.includes("three point") || lower.includes("3-pointer") || lower.includes("3-pt"))
    return "3PT Jump Shot";
  if (lower.includes("jumper") || lower.includes("jump shot"))
    return "Jump Shot";
  if (lower.includes("floater") || lower.includes("runner"))
    return "Floater";
  if (lower.includes("fadeaway")) return "Fadeaway";
  if (lower.includes("pullup") || lower.includes("pull-up"))
    return "Pull-Up";

  return "Jump Shot"; // default
}

/** Estimate shot distance from description, e.g. "makes 18-foot jumper" → 18 */
function parseShotDistance(description: string): number | null {
  const match = description.match(/(\d+)-foot/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Sync shot data for a single game from play-by-play.
 */
export async function syncShotsForGame(
  gameExternalId: number,
  gameId: string,
  teamIdMap: Map<string, string>,
  playerIdMap: Map<string, string>
) {
  const pbp = await getPlayByPlay(gameExternalId);
  if (!pbp.Plays || pbp.Plays.length === 0) return 0;

  const shotPlays = pbp.Plays.filter(
    (p) =>
      p.Type === "FieldGoalMade" ||
      p.Type === "FieldGoalMissed" ||
      p.Type === "MadeShot" ||
      p.Type === "MissedShot"
  );

  let synced = 0;

  for (const play of shotPlays) {
    if (!play.PlayerID || !play.TeamID) continue;

    const playerId = playerIdMap.get(String(play.PlayerID));
    const teamId = teamIdMap.get(String(play.TeamID));
    if (!playerId || !teamId) continue;

    const made =
      play.ShotMade ??
      (play.Type === "FieldGoalMade" || play.Type === "MadeShot");

    // Compute zone from coordinates if available
    let zoneId = "unknown";
    let baselineOffsetPct: string | null = null;
    let sidelineOffsetPct: string | null = null;

    if (
      play.BaselineOffsetPercentage != null &&
      play.SidelineOffsetPercentage != null
    ) {
      baselineOffsetPct = String(play.BaselineOffsetPercentage);
      sidelineOffsetPct = String(play.SidelineOffsetPercentage);
      const svgCoords = apiCoordsToSvg(
        play.BaselineOffsetPercentage,
        play.SidelineOffsetPercentage
      );
      zoneId = classifyShot(svgCoords.x, svgCoords.y);
    }

    const shotType = parseShotType(play.Description, play.Type);
    const shotDistance = parseShotDistance(play.Description);

    await db
      .insert(shots)
      .values({
        externalPlayId: String(play.PlayID),
        gameId,
        playerId,
        teamId,
        baselineOffsetPct,
        sidelineOffsetPct,
        zoneId,
        made,
        shotType,
        shotDistance: shotDistance != null ? String(shotDistance) : null,
        quarter: play.QuarterName,
        timeRemainingMinutes: play.TimeRemainingMinutes,
        timeRemainingSeconds: play.TimeRemainingSeconds,
        sequence: play.Sequence,
      })
      .onConflictDoUpdate({
        target: [shots.externalPlayId, shots.gameId],
        set: {
          baselineOffsetPct: sql`excluded.baseline_offset_pct`,
          sidelineOffsetPct: sql`excluded.sideline_offset_pct`,
          zoneId: sql`excluded.zone_id`,
          made: sql`excluded.made`,
          shotType: sql`excluded.shot_type`,
          shotDistance: sql`excluded.shot_distance`,
        },
      });

    synced++;
  }

  return synced;
}

/**
 * Sync shots for all final games on a given date.
 */
export async function syncShots(date: Date) {
  const teamIdMap = await getTeamIdMap();
  const playerIdMap = await getPlayerIdMap();

  // Find all final games for this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const dateGames = await db
    .select({ id: games.id, externalId: games.externalId, status: games.status })
    .from(games)
    .where(
      and(
        sql`${games.startTime} >= ${startOfDay.toISOString()}`,
        sql`${games.startTime} <= ${endOfDay.toISOString()}`,
        eq(games.status, "final")
      )
    );

  let totalSynced = 0;

  for (const game of dateGames) {
    const gameExternalId = parseInt(game.externalId, 10);
    if (isNaN(gameExternalId)) continue;

    try {
      const synced = await syncShotsForGame(
        gameExternalId,
        game.id,
        teamIdMap,
        playerIdMap
      );
      totalSynced += synced;
    } catch (error) {
      console.error(
        `Failed to sync shots for game ${game.externalId}:`,
        error
      );
    }
  }

  return { synced: totalSynced, games: dateGames.length };
}
