import { NextResponse } from "next/server";
import { db } from "@/db";
import { shots } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { ZONES } from "@/lib/shot-chart-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") || "zone";

  if (mode === "scatter") {
    // Return individual shot locations
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "500", 10),
      1000
    );

    const playerShots = await db
      .select({
        baselineOffsetPct: shots.baselineOffsetPct,
        sidelineOffsetPct: shots.sidelineOffsetPct,
        made: shots.made,
        shotType: shots.shotType,
        quarter: shots.quarter,
        gameId: shots.gameId,
      })
      .from(shots)
      .where(eq(shots.playerId, id))
      .orderBy(desc(shots.createdAt))
      .limit(limit);

    const scatterShots = playerShots
      .filter((s) => s.baselineOffsetPct != null && s.sidelineOffsetPct != null)
      .map((s) => ({
        x: parseFloat(s.baselineOffsetPct!),
        y: parseFloat(s.sidelineOffsetPct!),
        made: s.made,
        shotType: s.shotType,
        quarter: s.quarter,
        gameId: s.gameId,
      }));

    return NextResponse.json({ shots: scatterShots, total: scatterShots.length });
  }

  // Default: zone aggregation
  const zoneStats = await db
    .select({
      zoneId: shots.zoneId,
      fgm: sql<number>`sum(case when ${shots.made} then 1 else 0 end)`.as("fgm"),
      fga: sql<number>`count(*)`.as("fga"),
    })
    .from(shots)
    .where(eq(shots.playerId, id))
    .groupBy(shots.zoneId);

  if (zoneStats.length === 0) {
    return NextResponse.json({ zones: null, hasData: false });
  }

  const zoneMap = new Map(zoneStats.map((z) => [z.zoneId, z]));

  const zones = ZONES.map((zoneDef) => {
    const stats = zoneMap.get(zoneDef.id);
    const fgm = stats?.fgm ?? 0;
    const fga = stats?.fga ?? 0;
    const fgPct = fga > 0 ? Math.round((fgm / fga) * 1000) / 10 : 0;

    return {
      zoneId: zoneDef.id,
      name: zoneDef.name,
      nameZh: zoneDef.nameZh,
      fgm,
      fga,
      fgPct,
      leagueAvgPct: zoneDef.leagueAvgPct,
    };
  });

  return NextResponse.json({ zones, hasData: true });
}
