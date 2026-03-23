import { NextResponse } from "next/server";
import { db } from "@/db";
import { userFavoriteTeams, teams } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await db
    .select({
      team: {
        id: teams.id,
        name: teams.name,
        nameZh: teams.nameZh,
        abbreviation: teams.abbreviation,
        city: teams.city,
        conference: teams.conference,
        division: teams.division,
        logoUrl: teams.logoUrl,
        primaryColor: teams.primaryColor,
        secondaryColor: teams.secondaryColor,
      },
      isPrimary: userFavoriteTeams.isPrimary,
    })
    .from(userFavoriteTeams)
    .innerJoin(teams, eq(userFavoriteTeams.teamId, teams.id))
    .where(eq(userFavoriteTeams.userId, session.user.id));

  return NextResponse.json({ favorites });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const { teamId, isPrimary } = body as {
    teamId: string;
    isPrimary?: boolean;
  };

  if (!teamId) {
    return NextResponse.json(
      { error: "teamId is required" },
      { status: 400 }
    );
  }

  // Check team exists
  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  // Check max 5 favorites
  const [{ total }] = await db
    .select({ total: count() })
    .from(userFavoriteTeams)
    .where(eq(userFavoriteTeams.userId, userId));

  if (total >= 5) {
    return NextResponse.json(
      { error: "Maximum 5 favorite teams allowed" },
      { status: 400 }
    );
  }

  // If isPrimary, unset other primary first
  if (isPrimary) {
    await db
      .update(userFavoriteTeams)
      .set({ isPrimary: false })
      .where(
        and(
          eq(userFavoriteTeams.userId, userId),
          eq(userFavoriteTeams.isPrimary, true)
        )
      );
  }

  const [favorite] = await db
    .insert(userFavoriteTeams)
    .values({
      userId,
      teamId,
      isPrimary: isPrimary ?? false,
    })
    .returning();

  return NextResponse.json({ favorite }, { status: 201 });
}
