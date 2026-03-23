import { NextResponse } from "next/server";
import { db } from "@/db";
import { games, teams } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getOrSet } from "@/lib/redis";

const homeTeams = alias(teams, "homeTeams");
const awayTeams = alias(teams, "awayTeams");

export async function GET() {
  // Use ET timezone for "today" since NBA games are scheduled in ET
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  }); // YYYY-MM-DD format

  const data = await getOrSet(`scoreboard:${today}`, 30, async () => {
    const rows = await db
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
      .where(
        sql`DATE(${games.startTime} AT TIME ZONE 'America/New_York') = ${today}`
      )
      .orderBy(games.startTime);

    return rows.map((row) => ({
      id: row.game.id,
      startTime: row.game.startTime.toISOString(),
      status: row.game.status,
      period: row.game.period,
      clock: row.game.clock,
      homeTeam: row.homeTeam,
      awayTeam: row.awayTeam,
      homeScore: row.game.homeScore,
      awayScore: row.game.awayScore,
    }));
  });

  return NextResponse.json({ date: new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" }), games: data });
}
