import { db } from "@/db";
import { teams, players } from "@/db/schema";
import { getAllPlayers } from "@/lib/sportsdata";
import { normalizePlayer } from "./normalizer";
import { sql, eq } from "drizzle-orm";

async function getTeamIdMap(): Promise<Map<string, string>> {
  const allTeams = await db
    .select({ id: teams.id, externalId: teams.externalId })
    .from(teams);
  return new Map(allTeams.map((t) => [t.externalId, t.id]));
}

export async function syncPlayers() {
  const teamIdMap = await getTeamIdMap();
  const rawPlayers = await getAllPlayers();

  let synced = 0;
  for (const raw of rawPlayers) {
    const data = normalizePlayer(raw, teamIdMap);

    await db
      .insert(players)
      .values(data)
      .onConflictDoUpdate({
        target: players.externalId,
        set: {
          teamId: sql`excluded.team_id`,
          firstName: sql`excluded.first_name`,
          lastName: sql`excluded.last_name`,
          position: sql`excluded.position`,
          jerseyNumber: sql`excluded.jersey_number`,
          height: sql`excluded.height`,
          weight: sql`excluded.weight`,
          isActive: sql`excluded.is_active`,
          birthDate: sql`excluded.birth_date`,
          birthCity: sql`excluded.birth_city`,
          birthCountry: sql`excluded.birth_country`,
          college: sql`excluded.college`,
          draftYear: sql`excluded.draft_year`,
          draftRound: sql`excluded.draft_round`,
          draftNumber: sql`excluded.draft_number`,
          experience: sql`excluded.experience`,
          salary: sql`excluded.salary`,
          nbaDotComPlayerId: sql`excluded.nba_dot_com_player_id`,
          photoUrl: sql`excluded.photo_url`,
        },
      });
    synced++;
  }

  return { synced };
}
