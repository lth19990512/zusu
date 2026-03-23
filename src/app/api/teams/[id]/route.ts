import { NextResponse } from "next/server";
import { db } from "@/db";
import { teams, players } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, id))
    .limit(1);

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const roster = await db
    .select({
      id: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      nameZh: players.nameZh,
      position: players.position,
      jerseyNumber: players.jerseyNumber,
      height: players.height,
      weight: players.weight,
      photoUrl: players.photoUrl,
      nbaDotComPlayerId: players.nbaDotComPlayerId,
    })
    .from(players)
    .where(eq(players.teamId, id));

  return NextResponse.json({ team: { ...team, roster } });
}
