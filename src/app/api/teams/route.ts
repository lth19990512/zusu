import { NextResponse } from "next/server";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrSet } from "@/lib/redis";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conference = searchParams.get("conference");

  const cacheKey = conference ? `teams:${conference}` : "teams:all";

  const data = await getOrSet(cacheKey, 3600, async () => {
    let query = db.select().from(teams);

    if (conference === "East" || conference === "West") {
      query = query.where(eq(teams.conference, conference)) as typeof query;
    }

    return query;
  });

  return NextResponse.json({ teams: data });
}
