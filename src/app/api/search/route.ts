import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { players, teams, posts, users } from "@/db/schema";
import { or, ilike, eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ players: [], teams: [], posts: [] });
  }

  const pattern = `%${q}%`;

  const [playerResults, teamResults, postResults] = await Promise.all([
    // Search players by name
    db
      .select({
        id: players.id,
        firstName: players.firstName,
        lastName: players.lastName,
        position: players.position,
        teamId: players.teamId,
        photoUrl: players.photoUrl,
      })
      .from(players)
      .where(
        or(
          ilike(players.firstName, pattern),
          ilike(players.lastName, pattern),
          ilike(players.nameZh, pattern)
        )
      )
      .limit(5),

    // Search teams by name
    db
      .select({
        id: teams.id,
        name: teams.name,
        nameZh: teams.nameZh,
        abbreviation: teams.abbreviation,
        logoUrl: teams.logoUrl,
      })
      .from(teams)
      .where(
        or(
          ilike(teams.name, pattern),
          ilike(teams.nameZh, pattern),
          ilike(teams.abbreviation, pattern),
          ilike(teams.city, pattern)
        )
      )
      .limit(5),

    // Search posts by title
    db
      .select({
        id: posts.id,
        title: posts.title,
        authorName: users.displayName,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(ilike(posts.title, pattern), eq(posts.isDeleted, false)))
      .limit(5),
  ]);

  return NextResponse.json({
    players: playerResults,
    teams: teamResults,
    posts: postResults,
  });
}
