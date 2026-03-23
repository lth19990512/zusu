import { NextResponse } from "next/server";
import { db } from "@/db";
import { games, teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const homeTeams = alias(teams, "homeTeams");
const awayTeams = alias(teams, "awayTeams");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [row] = await db
    .select({
      game: games,
      homeTeam: {
        id: homeTeams.id,
        name: homeTeams.name,
        nameZh: homeTeams.nameZh,
        abbreviation: homeTeams.abbreviation,
        logoUrl: homeTeams.logoUrl,
      },
      awayTeam: {
        id: awayTeams.id,
        name: awayTeams.name,
        nameZh: awayTeams.nameZh,
        abbreviation: awayTeams.abbreviation,
        logoUrl: awayTeams.logoUrl,
      },
    })
    .from(games)
    .innerJoin(homeTeams, eq(games.homeTeamId, homeTeams.id))
    .innerJoin(awayTeams, eq(games.awayTeamId, awayTeams.id))
    .where(eq(games.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json({
    game: {
      id: row.game.id,
      startTime: row.game.startTime.toISOString(),
      status: row.game.status,
      period: row.game.period,
      clock: row.game.clock,
      venue: row.game.venue,
      homeTeam: row.homeTeam,
      awayTeam: row.awayTeam,
      homeScore: row.game.homeScore,
      awayScore: row.game.awayScore,
    },
  });
}
