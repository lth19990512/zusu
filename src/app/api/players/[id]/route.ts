export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { players, teams, gamePlayerStats, games } from "@/db/schema";
import { eq, desc, sql, and, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const opponentTeams = alias(teams, "opponentTeams");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch player with team info
  const [playerRow] = await db
    .select({
      player: players,
      team: {
        id: teams.id,
        name: teams.name,
        nameZh: teams.nameZh,
        abbreviation: teams.abbreviation,
        logoUrl: teams.logoUrl,
        primaryColor: teams.primaryColor,
        secondaryColor: teams.secondaryColor,
      },
    })
    .from(players)
    .leftJoin(teams, eq(players.teamId, teams.id))
    .where(eq(players.id, id))
    .limit(1);

  if (!playerRow) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Aggregate season stats
  const [seasonStats] = await db
    .select({
      gamesPlayed: sql<number>`count(*)`.as("games_played"),
      ppg: sql<number>`round(avg(${gamePlayerStats.points})::numeric, 1)`.as("ppg"),
      rpg: sql<number>`round(avg(${gamePlayerStats.rebounds})::numeric, 1)`.as("rpg"),
      apg: sql<number>`round(avg(${gamePlayerStats.assists})::numeric, 1)`.as("apg"),
      spg: sql<number>`round(avg(${gamePlayerStats.steals})::numeric, 1)`.as("spg"),
      bpg: sql<number>`round(avg(${gamePlayerStats.blocks})::numeric, 1)`.as("bpg"),
      mpg: sql<number>`round(avg(cast(${gamePlayerStats.minutes} as numeric)), 1)`.as("mpg"),
      fgPct: sql<number>`case when sum(${gamePlayerStats.fga}) > 0 then round(sum(${gamePlayerStats.fgm})::numeric / sum(${gamePlayerStats.fga})::numeric * 100, 1) else 0 end`.as("fg_pct"),
      fg3Pct: sql<number>`case when sum(${gamePlayerStats.fg3a}) > 0 then round(sum(${gamePlayerStats.fg3m})::numeric / sum(${gamePlayerStats.fg3a})::numeric * 100, 1) else 0 end`.as("fg3_pct"),
      ftPct: sql<number>`case when sum(${gamePlayerStats.fta}) > 0 then round(sum(${gamePlayerStats.ftm})::numeric / sum(${gamePlayerStats.fta})::numeric * 100, 1) else 0 end`.as("ft_pct"),
    })
    .from(gamePlayerStats)
    .where(eq(gamePlayerStats.playerId, id));

  // Recent game logs (last 10)
  const recentGames = await db
    .select({
      date: games.startTime,
      points: gamePlayerStats.points,
      rebounds: gamePlayerStats.rebounds,
      assists: gamePlayerStats.assists,
      minutes: gamePlayerStats.minutes,
      fgm: gamePlayerStats.fgm,
      fga: gamePlayerStats.fga,
      homeTeamId: games.homeTeamId,
      awayTeamId: games.awayTeamId,
      playerTeamId: gamePlayerStats.teamId,
      opponentName: opponentTeams.name,
      opponentAbbreviation: opponentTeams.abbreviation,
    })
    .from(gamePlayerStats)
    .innerJoin(games, eq(gamePlayerStats.gameId, games.id))
    .innerJoin(
      opponentTeams,
      sql`${opponentTeams.id} = case
        when ${gamePlayerStats.teamId} = ${games.homeTeamId} then ${games.awayTeamId}
        else ${games.homeTeamId}
      end`
    )
    .where(eq(gamePlayerStats.playerId, id))
    .orderBy(desc(games.startTime))
    .limit(10);

  const formattedRecentGames = recentGames.map((g) => ({
    date: g.date,
    opponent: {
      abbreviation: g.opponentAbbreviation,
      name: g.opponentName,
    },
    points: g.points,
    rebounds: g.rebounds,
    assists: g.assists,
    minutes: g.minutes,
    fgm: g.fgm,
    fga: g.fga,
  }));

  return NextResponse.json({
    player: {
      ...playerRow.player,
      team: playerRow.team,
    },
    seasonStats:
      seasonStats.gamesPlayed > 0
        ? seasonStats
        : null,
    recentGames: formattedRecentGames,
  });
}
