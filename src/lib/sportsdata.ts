/**
 * SportsData.io NBA API v3 client.
 *
 * API docs: https://sportsdata.io/developers/api-documentation/nba
 * API key is passed via query param `key`.
 * Date format: YYYY-MMM-DD (e.g., 2026-MAR-22)
 */

const BASE_URL =
  process.env.SPORTSDATA_BASE_URL || "https://api.sportsdata.io/v3/nba";
const API_KEY = process.env.SPORTSDATA_API_KEY || "";

// --- Raw API response types (as returned by SportsData.io) ---

export interface SdTeam {
  TeamID: number;
  Key: string; // abbreviation e.g. "LAL"
  City: string;
  Name: string; // e.g. "Lakers"
  Conference: string; // "Eastern" | "Western"
  Division: string;
  PrimaryColor: string | null;
  SecondaryColor: string | null;
  WikipediaLogoUrl: string | null;
  GlobalTeamID: number;
}

export interface SdPlayer {
  PlayerID: number;
  TeamID: number | null;
  Team: string | null; // abbreviation
  FirstName: string;
  LastName: string;
  Position: string | null;
  Jersey: number | null;
  Height: number | null; // inches
  Weight: number | null; // lbs
  Status: string; // "Active", "Inactive", etc.
  GlobalPlayerID: number;
  BirthDate: string | null;
  BirthCity: string | null;
  BirthCountry: string | null;
  College: string | null;
  DraftYear: number | null;
  DraftRound: number | null;
  DraftNumber: number | null;
  Experience: number | null;
  Salary: number | null;
  NbaDotComPlayerID: number | null;
}

export interface SdGame {
  GameID: number;
  Season: number;
  SeasonType: number; // 1=Preseason, 2=Regular, 3=Postseason
  Status: string; // "Scheduled", "InProgress", "Final", "Postponed", etc.
  DateTime: string | null; // ISO format
  HomeTeamID: number;
  AwayTeamID: number;
  HomeTeam: string; // abbreviation
  AwayTeam: string; // abbreviation
  HomeTeamScore: number | null;
  AwayTeamScore: number | null;
  Quarter: string | null; // "1", "2", "Half", "3", "4", "OT", etc.
  TimeRemainingMinutes: number | null;
  TimeRemainingSeconds: number | null;
  StadiumID: number | null;
  Channel: string | null;
  GlobalGameID: number;
  GlobalHomeTeamID: number;
  GlobalAwayTeamID: number;
  Quarters: SdQuarter[] | null;
}

export interface SdQuarter {
  QuarterID: number;
  GameID: number;
  Number: number;
  Name: string; // "1", "2", "3", "4", "OT", "OT2", etc.
  HomeScore: number | null;
  AwayScore: number | null;
}

export interface SdBoxScore {
  Game: SdGame;
  HomeTeam: SdTeamBoxScore | null;
  AwayTeam: SdTeamBoxScore | null;
  PlayerGames: SdPlayerGame[];
  TeamGames: SdTeamGame[];
}

export interface SdTeamBoxScore {
  TeamID: number;
  // Team-level aggregated stats are in SdTeamGame
}

export interface SdTeamGame {
  StatID: number;
  TeamID: number;
  GameID: number;
  Name: string; // team name
  Team: string; // abbreviation
  Wins: number | null;
  Losses: number | null;
  FieldGoalsMade: number;
  FieldGoalsAttempted: number;
  FieldGoalsPercentage: number;
  ThreePointersMade: number;
  ThreePointersAttempted: number;
  ThreePointersPercentage: number;
  FreeThrowsMade: number;
  FreeThrowsAttempted: number;
  FreeThrowsPercentage: number;
  OffensiveRebounds: number;
  DefensiveRebounds: number;
  Rebounds: number;
  Assists: number;
  Steals: number;
  BlockedShots: number;
  Turnovers: number;
  PersonalFouls: number;
  Points: number;
  HomeOrAway: string; // "HOME" | "AWAY"
  GlobalTeamID: number;
}

export interface SdPlayerGame {
  StatID: number;
  PlayerID: number;
  TeamID: number;
  GameID: number;
  Name: string; // "J. LeBron" etc.
  Team: string; // abbreviation
  Position: string | null;
  Minutes: number | null;
  Points: number;
  Rebounds: number;
  Assists: number;
  Steals: number;
  BlockedShots: number;
  Turnovers: number;
  FieldGoalsMade: number;
  FieldGoalsAttempted: number;
  FieldGoalsPercentage: number;
  ThreePointersMade: number;
  ThreePointersAttempted: number;
  ThreePointersPercentage: number;
  FreeThrowsMade: number;
  FreeThrowsAttempted: number;
  FreeThrowsPercentage: number;
  PlusMinus: number;
  Started: number; // 1 = started
  Jersey: number | null;
  HomeOrAway: string;
  GlobalPlayerID: number;
  GlobalTeamID: number;
}

export interface SdPlayByPlay {
  Game: SdGame;
  Plays: SdPlay[];
}

export interface SdPlay {
  PlayID: number;
  GameID: number;
  QuarterID: number;
  QuarterName: string;
  TimeRemainingMinutes: number | null;
  TimeRemainingSeconds: number | null;
  Type: string; // "FieldGoalMade", "Rebound", "Turnover", etc.
  Description: string;
  HomeTeamScore: number | null;
  AwayTeamScore: number | null;
  PlayerID: number | null;
  TeamID: number | null;
  Sequence: number;
  // Shot coordinate data
  BaselineOffsetPercentage: number | null;
  SidelineOffsetPercentage: number | null;
  ShotMade: boolean | null;
  Category: string | null; // "FieldGoal", "FreeThrow", etc.
  AssistedByPlayerID: number | null;
}

// --- API client ---

async function fetchApi<T>(endpoint: string): Promise<T> {
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${BASE_URL}${endpoint}${separator}key=${API_KEY}`;

  const response = await fetch(url, {
    headers: { "Ocp-Apim-Subscription-Key": API_KEY },
    next: { revalidate: 0 }, // no cache by default, callers control caching
  });

  if (!response.ok) {
    throw new Error(
      `SportsData API error: ${response.status} ${response.statusText} for ${endpoint}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Format date for SportsData.io API: YYYY-MMM-DD
 * e.g., 2026-MAR-22
 */
function formatApiDate(date: Date): string {
  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// --- Public API functions ---

export async function getTeams(): Promise<SdTeam[]> {
  return fetchApi<SdTeam[]>("/scores/json/teams");
}

export async function getPlayersByTeam(
  teamAbbreviation: string
): Promise<SdPlayer[]> {
  return fetchApi<SdPlayer[]>(`/scores/json/Players/${teamAbbreviation}`);
}

export async function getAllPlayers(): Promise<SdPlayer[]> {
  return fetchApi<SdPlayer[]>("/scores/json/Players");
}

export async function getGamesByDate(date: Date): Promise<SdGame[]> {
  return fetchApi<SdGame[]>(`/scores/json/GamesByDate/${formatApiDate(date)}`);
}

export async function getScoresByDate(date: Date): Promise<SdGame[]> {
  return fetchApi<SdGame[]>(`/scores/json/ScoresByDate/${formatApiDate(date)}`);
}

export async function getBoxScoresByDate(date: Date): Promise<SdBoxScore[]> {
  return fetchApi<SdBoxScore[]>(
    `/stats/json/BoxScores/${formatApiDate(date)}`
  );
}

export async function getBoxScore(gameId: number): Promise<SdBoxScore> {
  return fetchApi<SdBoxScore>(`/stats/json/BoxScore/${gameId}`);
}

export async function getPlayByPlay(gameId: number): Promise<SdPlayByPlay> {
  return fetchApi<SdPlayByPlay>(`/pbp/json/PlayByPlay/${gameId}`);
}

export async function getSchedule(season: number): Promise<SdGame[]> {
  return fetchApi<SdGame[]>(`/scores/json/Games/${season}`);
}

export async function getCurrentSeason(): Promise<{
  Season: number;
  SeasonType: string;
  ApiSeason: string;
}> {
  return fetchApi(`/scores/json/CurrentSeason`);
}

export { formatApiDate };
