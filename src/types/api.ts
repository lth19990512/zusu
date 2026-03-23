// Common API response types

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// Game types
export interface GameSummary {
  id: string;
  startTime: string;
  status: "scheduled" | "live" | "final" | "postponed";
  period: number;
  clock: string | null;
  homeTeam: TeamBrief;
  awayTeam: TeamBrief;
  homeScore: number;
  awayScore: number;
}

export interface TeamBrief {
  id: string;
  name: string;
  nameZh: string;
  abbreviation: string;
  logoUrl: string | null;
}

export interface BoxScore {
  homeTeam: {
    team: TeamBrief;
    stats: TeamStats;
    players: PlayerStats[];
  };
  awayTeam: {
    team: TeamBrief;
    stats: TeamStats;
    players: PlayerStats[];
  };
}

export interface TeamStats {
  fgm: number;
  fga: number;
  fgPct: string;
  fg3m: number;
  fg3a: number;
  fg3Pct: string;
  ftm: number;
  fta: number;
  ftPct: string;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  points: number;
}

export interface PlayerStats {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  jerseyNumber: string | null;
  minutes: string | null;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fgm: number;
  fga: number;
  fgPct: string;
  fg3m: number;
  fg3a: number;
  fg3Pct: string;
  ftm: number;
  fta: number;
  ftPct: string;
  plusMinus: number;
  starter: boolean;
}

// Post types
export interface PostSummary {
  id: string;
  title: string;
  type: "discussion" | "game_thread" | "post_game_thread";
  author: AuthorBrief;
  team: TeamBrief | null;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
}

export interface AuthorBrief {
  id: string;
  displayName: string;
  userNumber: number;
  // Formatted as "顯示名#0042"
  formattedName: string;
  avatarUrl: string | null;
}

export interface PostDetail extends PostSummary {
  content: string;
  isLikedByMe: boolean;
  isPinned: boolean;
  isLocked: boolean;
  updatedAt: string;
}

export interface CommentData {
  id: string;
  content: string;
  author: AuthorBrief;
  likeCount: number;
  isLikedByMe: boolean;
  parentId: string | null;
  createdAt: string;
  replies?: CommentData[];
}
