import { NextResponse } from "next/server";
import { db } from "@/db";
import { games, teams, players, gameTeamStats, gamePlayerStats } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get game
  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.id, id))
    .limit(1);

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Get team info
  const [homeTeam] = await db
    .select({
      id: teams.id,
      name: teams.name,
      nameZh: teams.nameZh,
      abbreviation: teams.abbreviation,
      logoUrl: teams.logoUrl,
    })
    .from(teams)
    .where(eq(teams.id, game.homeTeamId))
    .limit(1);

  const [awayTeam] = await db
    .select({
      id: teams.id,
      name: teams.name,
      nameZh: teams.nameZh,
      abbreviation: teams.abbreviation,
      logoUrl: teams.logoUrl,
    })
    .from(teams)
    .where(eq(teams.id, game.awayTeamId))
    .limit(1);

  // Get team stats
  const [homeStats] = await db
    .select()
    .from(gameTeamStats)
    .where(
      and(
        eq(gameTeamStats.gameId, id),
        eq(gameTeamStats.teamId, game.homeTeamId)
      )
    )
    .limit(1);

  const [awayStats] = await db
    .select()
    .from(gameTeamStats)
    .where(
      and(
        eq(gameTeamStats.gameId, id),
        eq(gameTeamStats.teamId, game.awayTeamId)
      )
    )
    .limit(1);

  // Get player stats with player info
  const homePlayerStats = await db
    .select({
      id: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      position: players.position,
      jerseyNumber: players.jerseyNumber,
      minutes: gamePlayerStats.minutes,
      points: gamePlayerStats.points,
      rebounds: gamePlayerStats.rebounds,
      assists: gamePlayerStats.assists,
      steals: gamePlayerStats.steals,
      blocks: gamePlayerStats.blocks,
      turnovers: gamePlayerStats.turnovers,
      fgm: gamePlayerStats.fgm,
      fga: gamePlayerStats.fga,
      fgPct: gamePlayerStats.fgPct,
      fg3m: gamePlayerStats.fg3m,
      fg3a: gamePlayerStats.fg3a,
      fg3Pct: gamePlayerStats.fg3Pct,
      ftm: gamePlayerStats.ftm,
      fta: gamePlayerStats.fta,
      ftPct: gamePlayerStats.ftPct,
      plusMinus: gamePlayerStats.plusMinus,
      starter: gamePlayerStats.starter,
    })
    .from(gamePlayerStats)
    .innerJoin(players, eq(gamePlayerStats.playerId, players.id))
    .where(
      and(
        eq(gamePlayerStats.gameId, id),
        eq(gamePlayerStats.teamId, game.homeTeamId)
      )
    );

  const awayPlayerStats = await db
    .select({
      id: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      position: players.position,
      jerseyNumber: players.jerseyNumber,
      minutes: gamePlayerStats.minutes,
      points: gamePlayerStats.points,
      rebounds: gamePlayerStats.rebounds,
      assists: gamePlayerStats.assists,
      steals: gamePlayerStats.steals,
      blocks: gamePlayerStats.blocks,
      turnovers: gamePlayerStats.turnovers,
      fgm: gamePlayerStats.fgm,
      fga: gamePlayerStats.fga,
      fgPct: gamePlayerStats.fgPct,
      fg3m: gamePlayerStats.fg3m,
      fg3a: gamePlayerStats.fg3a,
      fg3Pct: gamePlayerStats.fg3Pct,
      ftm: gamePlayerStats.ftm,
      fta: gamePlayerStats.fta,
      ftPct: gamePlayerStats.ftPct,
      plusMinus: gamePlayerStats.plusMinus,
      starter: gamePlayerStats.starter,
    })
    .from(gamePlayerStats)
    .innerJoin(players, eq(gamePlayerStats.playerId, players.id))
    .where(
      and(
        eq(gamePlayerStats.gameId, id),
        eq(gamePlayerStats.teamId, game.awayTeamId)
      )
    );

  return NextResponse.json({
    homeTeam: {
      team: homeTeam,
      stats: homeStats || null,
      players: homePlayerStats,
    },
    awayTeam: {
      team: awayTeam,
      stats: awayStats || null,
      players: awayPlayerStats,
    },
  });
}
