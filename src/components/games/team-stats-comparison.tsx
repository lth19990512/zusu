"use client";

import type { TeamStats, TeamBrief } from "@/types/api";

interface StatRow {
  label: string;
  home: string | number;
  away: string | number;
  higherIsBetter?: boolean;
}

function getStatRows(home: TeamStats, away: TeamStats): StatRow[] {
  return [
    { label: "Points", home: home.points, away: away.points, higherIsBetter: true },
    { label: "FG%", home: home.fgPct, away: away.fgPct, higherIsBetter: true },
    { label: "3P%", home: home.fg3Pct, away: away.fg3Pct, higherIsBetter: true },
    { label: "FT%", home: home.ftPct, away: away.ftPct, higherIsBetter: true },
    { label: "Rebounds", home: home.rebounds, away: away.rebounds, higherIsBetter: true },
    { label: "Assists", home: home.assists, away: away.assists, higherIsBetter: true },
    { label: "Steals", home: home.steals, away: away.steals, higherIsBetter: true },
    { label: "Blocks", home: home.blocks, away: away.blocks, higherIsBetter: true },
    { label: "Turnovers", home: home.turnovers, away: away.turnovers, higherIsBetter: false },
  ];
}

export function TeamStatsComparison({
  homeTeam,
  awayTeam,
  homeStats,
  awayStats,
}: {
  homeTeam: TeamBrief;
  awayTeam: TeamBrief;
  homeStats: TeamStats;
  awayStats: TeamStats;
}) {
  const rows = getStatRows(homeStats, awayStats);

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between text-sm font-semibold px-2 pb-2">
        <span>{awayTeam.abbreviation}</span>
        <span className="text-muted-foreground text-xs">STAT</span>
        <span>{homeTeam.abbreviation}</span>
      </div>

      {/* Stat rows */}
      {rows.map((row) => {
        const homeNum = parseFloat(String(row.home));
        const awayNum = parseFloat(String(row.away));
        const homeWins = row.higherIsBetter
          ? homeNum > awayNum
          : homeNum < awayNum;
        const awayWins = row.higherIsBetter
          ? awayNum > homeNum
          : awayNum < homeNum;

        return (
          <div
            key={row.label}
            className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-muted/50"
          >
            <span
              className={`w-16 text-left tabular-nums ${
                awayWins ? "font-bold" : "text-muted-foreground"
              }`}
            >
              {row.away}
            </span>
            <span className="text-xs text-muted-foreground flex-1 text-center">
              {row.label}
            </span>
            <span
              className={`w-16 text-right tabular-nums ${
                homeWins ? "font-bold" : "text-muted-foreground"
              }`}
            >
              {row.home}
            </span>
          </div>
        );
      })}
    </div>
  );
}
