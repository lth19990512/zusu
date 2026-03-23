import { db } from "@/db";
import { teams } from "@/db/schema";
import { getTeams } from "@/lib/sportsdata";
import { normalizeTeam } from "./normalizer";
import { sql } from "drizzle-orm";

export async function syncTeams() {
  const rawTeams = await getTeams();

  for (const raw of rawTeams) {
    const data = normalizeTeam(raw);

    await db
      .insert(teams)
      .values(data)
      .onConflictDoUpdate({
        target: teams.externalId,
        set: {
          name: sql`excluded.name`,
          nameZh: sql`excluded.name_zh`,
          city: sql`excluded.city`,
          conference: sql`excluded.conference`,
          division: sql`excluded.division`,
          logoUrl: sql`excluded.logo_url`,
          primaryColor: sql`excluded.primary_color`,
          secondaryColor: sql`excluded.secondary_color`,
        },
      });
  }

  return { synced: rawTeams.length };
}
