/**
 * Maps SportsData.io API responses to our internal Drizzle insert types.
 */

import type {
  SdTeam,
  SdPlayer,
  SdGame,
  SdTeamGame,
  SdPlayerGame,
} from "@/lib/sportsdata";

// --- Team normalization ---

// Chinese team names mapping (SportsData doesn't provide these)
const TEAM_NAMES_ZH: Record<string, string> = {
  ATL: "亞特蘭大老鷹",
  BOS: "波士頓塞爾提克",
  BKN: "布魯克林籃網",
  CHA: "夏洛特黃蜂",
  CHI: "芝加哥公牛",
  CLE: "克里夫蘭騎士",
  DAL: "達拉斯獨行俠",
  DEN: "丹佛金塊",
  DET: "底特律活塞",
  GS: "金州勇士",
  GSW: "金州勇士",
  HOU: "休士頓火箭",
  IND: "印第安納溜馬",
  LAC: "洛杉磯快艇",
  LAL: "洛杉磯湖人",
  MEM: "曼菲斯灰熊",
  MIA: "邁阿密熱火",
  MIL: "密爾瓦基公鹿",
  MIN: "明尼蘇達灰狼",
  NO: "紐奧良鵜鶘",
  NOP: "紐奧良鵜鶘",
  NY: "紐約尼克",
  NYK: "紐約尼克",
  OKC: "奧克拉荷馬雷霆",
  ORL: "奧蘭多魔術",
  PHI: "費城76人",
  PHO: "鳳凰城太陽",
  PHX: "鳳凰城太陽",
  POR: "波特蘭拓荒者",
  SAC: "沙加緬度國王",
  SA: "聖安東尼奧馬刺",
  SAS: "聖安東尼奧馬刺",
  TOR: "多倫多暴龍",
  UTA: "猶他爵士",
  WAS: "華盛頓巫師",
};

export function normalizeTeam(raw: SdTeam) {
  return {
    externalId: String(raw.TeamID),
    name: `${raw.City} ${raw.Name}`,
    nameZh: TEAM_NAMES_ZH[raw.Key] || `${raw.City} ${raw.Name}`,
    abbreviation: raw.Key,
    city: raw.City,
    conference: raw.Conference === "Eastern" ? ("East" as const) : ("West" as const),
    division: raw.Division,
    logoUrl: raw.WikipediaLogoUrl,
    primaryColor: raw.PrimaryColor ? `#${raw.PrimaryColor}` : null,
    secondaryColor: raw.SecondaryColor ? `#${raw.SecondaryColor}` : null,
  };
}

// --- Player normalization ---

function inchesToHeight(inches: number | null): string | null {
  if (!inches) return null;
  const feet = Math.floor(inches / 12);
  const remaining = inches % 12;
  return `${feet}'${remaining}"`;
}

export function normalizePlayer(
  raw: SdPlayer,
  teamExternalIdToId: Map<string, string>
) {
  return {
    externalId: String(raw.PlayerID),
    teamId: raw.TeamID ? teamExternalIdToId.get(String(raw.TeamID)) ?? null : null,
    firstName: raw.FirstName,
    lastName: raw.LastName,
    position: raw.Position,
    jerseyNumber: raw.Jersey != null ? String(raw.Jersey) : null,
    height: inchesToHeight(raw.Height),
    weight: raw.Weight ? `${raw.Weight} lbs` : null,
    isActive: raw.Status === "Active",
    birthDate: raw.BirthDate?.split("T")[0] || null,
    birthCity: raw.BirthCity,
    birthCountry: raw.BirthCountry,
    college: raw.College,
    draftYear: raw.DraftYear,
    draftRound: raw.DraftRound,
    draftNumber: raw.DraftNumber,
    experience: raw.Experience,
    salary: raw.Salary,
    nbaDotComPlayerId: raw.NbaDotComPlayerID,
    photoUrl: raw.NbaDotComPlayerID
      ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${raw.NbaDotComPlayerID}.png`
      : null,
  };
}

// --- Game normalization ---

function normalizeGameStatus(
  status: string
): "scheduled" | "live" | "final" | "postponed" {
  switch (status) {
    case "InProgress":
      return "live";
    case "Final":
    case "F/OT":
      return "final";
    case "Postponed":
    case "Canceled":
    case "Suspended":
      return "postponed";
    default:
      return "scheduled";
  }
}

function normalizeQuarter(quarter: string | null): number {
  if (!quarter) return 0;
  const num = parseInt(quarter, 10);
  if (!isNaN(num)) return num;
  if (quarter === "Half") return 2;
  if (quarter.startsWith("OT")) return 5; // OT = 5, OT2 = 6, etc.
  return 0;
}

function formatClock(minutes: number | null, seconds: number | null): string | null {
  if (minutes == null && seconds == null) return null;
  const m = minutes ?? 0;
  const s = seconds ?? 0;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function normalizeGame(
  raw: SdGame,
  teamExternalIdToId: Map<string, string>,
  seasonId: string
) {
  return {
    externalId: String(raw.GameID),
    seasonId,
    homeTeamId: teamExternalIdToId.get(String(raw.HomeTeamID))!,
    awayTeamId: teamExternalIdToId.get(String(raw.AwayTeamID))!,
    status: normalizeGameStatus(raw.Status),
    startTime: raw.DateTime ? new Date(raw.DateTime) : new Date(),
    homeScore: raw.HomeTeamScore ?? 0,
    awayScore: raw.AwayTeamScore ?? 0,
    period: normalizeQuarter(raw.Quarter),
    clock: formatClock(raw.TimeRemainingMinutes, raw.TimeRemainingSeconds),
  };
}

// --- Team game stats normalization ---

export function normalizeTeamGameStats(
  raw: SdTeamGame,
  gameId: string,
  teamExternalIdToId: Map<string, string>
) {
  return {
    gameId,
    teamId: teamExternalIdToId.get(String(raw.TeamID))!,
    fgm: raw.FieldGoalsMade,
    fga: raw.FieldGoalsAttempted,
    fgPct: String(raw.FieldGoalsPercentage),
    fg3m: raw.ThreePointersMade,
    fg3a: raw.ThreePointersAttempted,
    fg3Pct: String(raw.ThreePointersPercentage),
    ftm: raw.FreeThrowsMade,
    fta: raw.FreeThrowsAttempted,
    ftPct: String(raw.FreeThrowsPercentage),
    offReb: raw.OffensiveRebounds,
    defReb: raw.DefensiveRebounds,
    rebounds: raw.Rebounds,
    assists: raw.Assists,
    steals: raw.Steals,
    blocks: raw.BlockedShots,
    turnovers: raw.Turnovers,
    personalFouls: raw.PersonalFouls,
    points: raw.Points,
  };
}

// --- Player game stats normalization ---

export function normalizePlayerGameStats(
  raw: SdPlayerGame,
  gameId: string,
  teamExternalIdToId: Map<string, string>,
  playerExternalIdToId: Map<string, string>
) {
  return {
    gameId,
    playerId: playerExternalIdToId.get(String(raw.PlayerID))!,
    teamId: teamExternalIdToId.get(String(raw.TeamID))!,
    minutes: raw.Minutes != null ? String(Math.round(raw.Minutes)) : null,
    points: raw.Points,
    rebounds: raw.Rebounds,
    assists: raw.Assists,
    steals: raw.Steals,
    blocks: raw.BlockedShots,
    turnovers: raw.Turnovers,
    fgm: raw.FieldGoalsMade,
    fga: raw.FieldGoalsAttempted,
    fgPct: String(raw.FieldGoalsPercentage),
    fg3m: raw.ThreePointersMade,
    fg3a: raw.ThreePointersAttempted,
    fg3Pct: String(raw.ThreePointersPercentage),
    ftm: raw.FreeThrowsMade,
    fta: raw.FreeThrowsAttempted,
    ftPct: String(raw.FreeThrowsPercentage),
    plusMinus: raw.PlusMinus,
    starter: raw.Started === 1,
  };
}
