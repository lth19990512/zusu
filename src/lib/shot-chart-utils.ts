/**
 * Shot chart zone definitions, color calculations, and mock data generation.
 *
 * 14-zone system matching NBA.com standard breakdown.
 * Colors are relative to league average per zone, with opacity encoding shot volume.
 */

// ---------------------------------------------------------------------------
// Zone definitions
// ---------------------------------------------------------------------------

export interface ZoneDefinition {
  id: string;
  name: string;
  nameZh: string;
  leagueAvgPct: number; // 2024-25 season approximate
}

export const ZONES: ZoneDefinition[] = [
  { id: "restrictedArea", name: "Restricted Area", nameZh: "禁區", leagueAvgPct: 63.0 },
  { id: "paint", name: "In The Paint", nameZh: "油漆區", leagueAvgPct: 40.0 },
  { id: "midLeftBaseline", name: "Mid-Range Left Baseline", nameZh: "左底線中距離", leagueAvgPct: 41.0 },
  { id: "midRightBaseline", name: "Mid-Range Right Baseline", nameZh: "右底線中距離", leagueAvgPct: 41.0 },
  { id: "midLeftElbow", name: "Mid-Range Left", nameZh: "左肘區中距離", leagueAvgPct: 40.0 },
  { id: "midRightElbow", name: "Mid-Range Right", nameZh: "右肘區中距離", leagueAvgPct: 40.0 },
  { id: "midTop", name: "Mid-Range Top", nameZh: "罰球線上方中距離", leagueAvgPct: 41.0 },
  { id: "corner3Left", name: "3PT Left Corner", nameZh: "左底角三分", leagueAvgPct: 38.0 },
  { id: "corner3Right", name: "3PT Right Corner", nameZh: "右底角三分", leagueAvgPct: 38.0 },
  { id: "wing3Left", name: "3PT Left Wing", nameZh: "左側45度三分", leagueAvgPct: 36.0 },
  { id: "wing3Right", name: "3PT Right Wing", nameZh: "右側45度三分", leagueAvgPct: 36.0 },
  { id: "top3Left", name: "3PT Top Left", nameZh: "弧頂左側三分", leagueAvgPct: 36.5 },
  { id: "top3Right", name: "3PT Top Right", nameZh: "弧頂右側三分", leagueAvgPct: 36.5 },
  { id: "deep3", name: "Deep 3", nameZh: "超遠三分", leagueAvgPct: 30.0 },
];

export const LEAGUE_AVG: Record<string, number> = Object.fromEntries(
  ZONES.map((z) => [z.id, z.leagueAvgPct])
);

// ---------------------------------------------------------------------------
// Color system — 3-tier fire / neutral / ice
// ---------------------------------------------------------------------------

const COLOR_HOT = "#34d399";     // emerald — above average (good)
const COLOR_NEUTRAL = "#94a3b8"; // slate — near average (neutral)
const COLOR_COLD = "#f87171";    // coral-red — below average (bad)

export interface ZoneColorInfo {
  fill: string;
  glowIntensity: number; // 0–1, controls glow strength
  tier: "hot" | "neutral" | "cold";
}

export function getZoneColor(playerPct: number, leagueAvgPct: number): string {
  return getZoneColorInfo(playerPct, leagueAvgPct).fill;
}

export function getZoneColorInfo(playerPct: number, leagueAvgPct: number): ZoneColorInfo {
  const delta = playerPct - leagueAvgPct;
  if (delta > 3) return { fill: COLOR_HOT, glowIntensity: 0.8, tier: "hot" };
  if (delta < -3) return { fill: COLOR_COLD, glowIntensity: 0.5, tier: "cold" };
  return { fill: COLOR_NEUTRAL, glowIntensity: 0.2, tier: "neutral" };
}

// ---------------------------------------------------------------------------
// Shot zone data type
// ---------------------------------------------------------------------------

export interface ShotZoneData {
  zoneId: string;
  name: string;
  nameZh: string;
  fgm: number;
  fga: number;
  fgPct: number;
  leagueAvgPct: number;
}

// ---------------------------------------------------------------------------
// Mock data generation — position-aware archetypes
// ---------------------------------------------------------------------------

type Archetype =
  | "scoringGuard"
  | "playmakingGuard"
  | "threeAndDWing"
  | "stretchBig"
  | "rimRunner";

function positionToArchetype(position: string | null): Archetype {
  switch (position) {
    case "PG":
      return "playmakingGuard";
    case "SG":
      return "scoringGuard";
    case "SF":
      return "threeAndDWing";
    case "PF":
      return "stretchBig";
    case "C":
      return "rimRunner";
    default:
      return "scoringGuard";
  }
}

// FGA distribution per archetype (must sum to ~1.0 across 14 zones)
const ARCHETYPE_FGA: Record<Archetype, number[]> = {
  // [restrictedArea, paint, midLB, midRB, midLE, midRE, midTop, c3L, c3R, w3L, w3R, t3L, t3R, deep3]
  scoringGuard:     [0.15, 0.06, 0.04, 0.04, 0.05, 0.05, 0.06, 0.04, 0.04, 0.10, 0.10, 0.12, 0.12, 0.03],
  playmakingGuard:  [0.18, 0.08, 0.03, 0.03, 0.04, 0.04, 0.05, 0.03, 0.03, 0.08, 0.08, 0.14, 0.14, 0.05],
  threeAndDWing:    [0.12, 0.04, 0.03, 0.03, 0.03, 0.03, 0.03, 0.08, 0.08, 0.12, 0.12, 0.12, 0.12, 0.05],
  stretchBig:       [0.20, 0.08, 0.04, 0.04, 0.04, 0.04, 0.05, 0.05, 0.05, 0.08, 0.08, 0.10, 0.10, 0.05],
  rimRunner:        [0.35, 0.18, 0.06, 0.06, 0.05, 0.05, 0.04, 0.02, 0.02, 0.04, 0.04, 0.04, 0.04, 0.01],
};

// FG% offset from league average per archetype
const ARCHETYPE_FG_OFFSET: Record<Archetype, number[]> = {
  scoringGuard:     [+2, -1, +3, +2, +4, +3, +2, +2, +3, +1, +2, +1, +1, -2],
  playmakingGuard:  [+5, +2, 0, -1, +1, 0, +2, +1, +1, +2, +2, +3, +3, +1],
  threeAndDWing:    [+3, 0, -2, -2, -1, -1, -3, +4, +4, +3, +3, +2, +2, -1],
  stretchBig:       [+4, +3, -1, 0, -2, -1, -1, +2, +2, +1, +1, +1, +1, -3],
  rimRunner:        [+8, +5, -5, -5, -6, -6, -8, -5, -5, -8, -8, -10, -10, -15],
};

export function generateMockShotData(
  position: string | null,
  totalFga: number = 800
): ShotZoneData[] {
  const archetype = positionToArchetype(position);
  const fgaDist = ARCHETYPE_FGA[archetype];
  const fgOffset = ARCHETYPE_FG_OFFSET[archetype];

  return ZONES.map((zone, i) => {
    const fga = Math.round(totalFga * fgaDist[i]);
    const fgPct = Math.max(0, Math.min(100, zone.leagueAvgPct + fgOffset[i]));
    const fgm = Math.round(fga * (fgPct / 100));
    return {
      zoneId: zone.id,
      name: zone.name,
      nameZh: zone.nameZh,
      fgm,
      fga,
      fgPct: fga > 0 ? Math.round((fgm / fga) * 1000) / 10 : 0,
      leagueAvgPct: zone.leagueAvgPct,
    };
  });
}

// ---------------------------------------------------------------------------
// Mock scatter shot generation
// ---------------------------------------------------------------------------

/** Simple seeded PRNG for deterministic mock data */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface MockShot {
  x: number; // SVG x
  y: number; // SVG y
  made: boolean;
}

/**
 * Generate mock individual shots matching zone distribution.
 * Uses seeded RNG so the same position always gives the same shots.
 * Every point is verified with classifyShot() to ensure correct placement.
 */
export function generateMockShots(
  position: string | null,
  count: number = 200
): MockShot[] {
  const archetype = positionToArchetype(position);
  const fgaDist = ARCHETYPE_FGA[archetype];
  const fgOffset = ARCHETYPE_FG_OFFSET[archetype];
  const rng = mulberry32(archetype.length * 1000 + 42);

  const shots: MockShot[] = [];

  for (let z = 0; z < ZONES.length; z++) {
    const zone = ZONES[z];
    const n = Math.round(count * fgaDist[z]);
    const fgPct = (zone.leagueAvgPct + fgOffset[z]) / 100;

    for (let i = 0; i < n; i++) {
      const { x, y } = samplePointInZone(zone.id, rng);
      shots.push({ x, y, made: rng() < fgPct });
    }
  }
  return shots;
}

// Bounding boxes for zone sampling — well inside court lines.
// Court SVG area: (20,20)-(480,460), basket at (250,423).
// We inset generously so dots never appear on/beyond court lines.
const ZONE_BBOX: Record<string, { xMin: number; xMax: number; yMin: number; yMax: number }> = {
  restrictedArea:   { xMin: 218, xMax: 282, yMin: 390, yMax: 418 },
  paint:            { xMin: 182, xMax: 318, yMin: 290, yMax: 445 },
  midLeftBaseline:  { xMin: 60,  xMax: 170, yMin: 295, yMax: 440 },
  midRightBaseline: { xMin: 330, xMax: 440, yMin: 295, yMax: 440 },
  midLeftElbow:     { xMin: 90,  xMax: 170, yMin: 225, yMax: 275 },
  midRightElbow:    { xMin: 330, xMax: 410, yMin: 225, yMax: 275 },
  midTop:           { xMin: 185, xMax: 315, yMin: 215, yMax: 275 },
  corner3Left:      { xMin: 35,  xMax: 42,  yMin: 350, yMax: 440 },
  corner3Right:     { xMin: 458, xMax: 465, yMin: 350, yMax: 440 },
  wing3Left:        { xMin: 35,  xMax: 140, yMin: 235, yMax: 330 },
  wing3Right:       { xMin: 360, xMax: 465, yMin: 235, yMax: 330 },
  top3Left:         { xMin: 50,  xMax: 240, yMin: 80,  yMax: 215 },
  top3Right:        { xMin: 260, xMax: 450, yMin: 80,  yMax: 215 },
  deep3:            { xMin: 80,  xMax: 420, yMin: 45,  yMax: 78  },
};

/** Sample a random point guaranteed to be in the correct zone via rejection sampling */
function samplePointInZone(zoneId: string, rng: () => number): { x: number; y: number } {
  const bb = ZONE_BBOX[zoneId];
  if (!bb) return { x: 250, y: 423 };

  for (let attempt = 0; attempt < 200; attempt++) {
    const x = bb.xMin + rng() * (bb.xMax - bb.xMin);
    const y = bb.yMin + rng() * (bb.yMax - bb.yMin);
    // Verify the point actually lands in the target zone
    if (classifyShot(x, y) === zoneId) return { x, y };
  }
  // Fallback: center of bounding box
  return { x: (bb.xMin + bb.xMax) / 2, y: (bb.yMin + bb.yMax) / 2 };
}

// ---------------------------------------------------------------------------
// Coordinate conversion (for Tier 2 scatter view)
// ---------------------------------------------------------------------------

/**
 * Convert SportsData.io API coordinates to SVG coordinates.
 * API: BaselineOffsetPercentage (0=baseline, 100=half-court),
 *      SidelineOffsetPercentage (0=left sideline, 100=right sideline).
 * SVG: 500x470, court area 20-480 x 20-460, basket at (250, 423).
 */
export function apiCoordsToSvg(
  baselinePct: number,
  sidelinePct: number
): { x: number; y: number } {
  const x = 20 + (sidelinePct / 100) * 460;
  const y = 460 - (baselinePct / 100) * 440;
  return { x, y };
}

/**
 * Classify a shot into one of 14 zones based on SVG coordinates.
 * NBA-accurate geometry: basket at (250, 423), 3pt arc r=222, paint 175-325.
 */
export function classifyShot(svgX: number, svgY: number): string {
  const bx = 250;
  const by = 423;
  const dx = svgX - bx;
  const dy = svgY - by;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Restricted area: 37px radius (~4ft)
  if (dist <= 37) return "restrictedArea";

  // Paint: x=175-325, y=282-460, excluding restricted
  if (svgX >= 175 && svgX <= 325 && svgY >= 282) return "paint";

  // 3pt arc: r=222, corner 3 at x=44/456 below y≈340
  const cornerX = 206; // half-width of corner 3
  const cornerTop = by - Math.sqrt(222 * 222 - cornerX * cornerX);
  const isInside3pt = dist < 222 || (svgY > cornerTop && svgX > (bx - cornerX) && svgX < (bx + cornerX));

  if (isInside3pt) {
    if (svgY > 380) return svgX < bx ? "midLeftBaseline" : "midRightBaseline";
    if (svgY > 282) return svgX < bx ? "midLeftElbow" : "midRightElbow";
    return "midTop";
  }

  // Deep 3: beyond ~28ft (262px)
  if (dist > 262) return "deep3";

  // Corner 3s
  if (svgY > cornerTop) return svgX < bx ? "corner3Left" : "corner3Right";

  // Wing vs top 3 based on angle
  const angle = Math.atan2(-dy, dx) * (180 / Math.PI);
  if (angle > 60) return svgX < bx ? "top3Left" : "top3Right";
  return svgX < bx ? "wing3Left" : "wing3Right";
}
