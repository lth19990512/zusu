import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { players, teams, gamePlayerStats } from "@/db/schema";
import { eq, sql, desc, gte } from "drizzle-orm";

const VALID_CATEGORIES = ["ppg", "rpg", "apg", "spg", "bpg"] as const;

function getCategoryColumn(category: string) {
  switch (category) {
    case "rpg": return gamePlayerStats.rebounds;
    case "apg": return gamePlayerStats.assists;
    case "spg": return gamePlayerStats.steals;
    case "bpg": return gamePlayerStats.blocks;
    default: return gamePlayerStats.points;
  }
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") || "ppg";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 5, 20);

  if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const col = getCategoryColumn(category);

  const leaders = await db
    .select({
      id: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      position: players.position,
      photoUrl: players.photoUrl,
      jerseyNumber: players.jerseyNumber,
      teamAbbreviation: teams.abbreviation,
      teamLogoUrl: teams.logoUrl,
      teamPrimaryColor: teams.primaryColor,
      avg: sql<number>`ROUND(AVG(${col})::numeric, 1)`.as("avg"),
      gamesPlayed: sql<number>`COUNT(*)`.as("games_played"),
    })
    .from(gamePlayerStats)
    .innerJoin(players, eq(gamePlayerStats.playerId, players.id))
    .innerJoin(teams, eq(players.teamId, teams.id))
    .groupBy(players.id, teams.id, teams.abbreviation, teams.logoUrl, teams.primaryColor)
    .having(gte(sql`COUNT(*)`, 10))
    .orderBy(desc(sql`AVG(${col})`))
    .limit(limit);

  return NextResponse.json({ leaders, category });
}
