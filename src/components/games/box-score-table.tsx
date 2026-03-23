"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlayerStats } from "@/types/api";

const STAT_COLUMNS = [
  { key: "minutes", label: "MIN", width: "w-12", mobile: true },
  { key: "points", label: "PTS", width: "w-10", mobile: true },
  { key: "rebounds", label: "REB", width: "w-10", mobile: true },
  { key: "assists", label: "AST", width: "w-10", mobile: true },
  { key: "steals", label: "STL", width: "w-10", mobile: false },
  { key: "blocks", label: "BLK", width: "w-10", mobile: false },
  { key: "turnovers", label: "TO", width: "w-10", mobile: false },
  { key: "fgm", label: "FG", width: "w-10", showWith: "fga", mobile: true },
  { key: "fg3m", label: "3PM", width: "w-10", showWith: "fg3a", mobile: false },
  { key: "ftm", label: "FTM", width: "w-10", showWith: "fta", mobile: false },
  { key: "plusMinus", label: "+/-", width: "w-10", mobile: false },
] as const;

function formatShooting(made: number, attempted: number): string {
  return `${made}-${attempted}`;
}

export function BoxScoreTable({ players }: { players: PlayerStats[] }) {
  const starters = players.filter((p) => p.starter);
  const bench = players.filter((p) => !p.starter);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10 min-w-[140px]">
              Player
            </TableHead>
            {STAT_COLUMNS.map((col) => (
              <TableHead
                key={col.key}
                className={`text-center ${col.width} text-xs ${col.mobile ? "" : "hidden sm:table-cell"}`}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Starters */}
          {starters.length > 0 && (
            <TableRow>
              <TableCell
                colSpan={STAT_COLUMNS.length + 1}
                className="text-xs font-semibold text-muted-foreground bg-muted/50 py-1"
              >
                Starters
              </TableCell>
            </TableRow>
          )}
          {starters.map((player) => (
            <PlayerRow key={player.id} player={player} />
          ))}

          {/* Bench */}
          {bench.length > 0 && (
            <TableRow>
              <TableCell
                colSpan={STAT_COLUMNS.length + 1}
                className="text-xs font-semibold text-muted-foreground bg-muted/50 py-1"
              >
                Bench
              </TableCell>
            </TableRow>
          )}
          {bench.map((player) => (
            <PlayerRow key={player.id} player={player} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PlayerRow({ player }: { player: PlayerStats }) {
  return (
    <TableRow>
      <TableCell className="sticky left-0 bg-background z-10 font-medium text-sm whitespace-nowrap">
        <div className="flex items-center gap-1">
          {player.jerseyNumber && (
            <span className="text-xs text-muted-foreground w-5">
              #{player.jerseyNumber}
            </span>
          )}
          <span>
            {player.firstName.charAt(0)}. {player.lastName}
          </span>
          {player.position && (
            <span className="text-xs text-muted-foreground">
              {player.position}
            </span>
          )}
        </div>
      </TableCell>
      {/* MIN */}
      <TableCell className="text-center text-xs tabular-nums">
        {player.minutes ?? "-"}
      </TableCell>
      {/* PTS */}
      <TableCell className="text-center font-semibold text-sm tabular-nums">
        {player.points}
      </TableCell>
      {/* REB */}
      <TableCell className="text-center text-xs tabular-nums">
        {player.rebounds}
      </TableCell>
      {/* AST */}
      <TableCell className="text-center text-xs tabular-nums">
        {player.assists}
      </TableCell>
      {/* STL — hidden on mobile */}
      <TableCell className="text-center text-xs tabular-nums hidden sm:table-cell">
        {player.steals}
      </TableCell>
      {/* BLK — hidden on mobile */}
      <TableCell className="text-center text-xs tabular-nums hidden sm:table-cell">
        {player.blocks}
      </TableCell>
      {/* TO — hidden on mobile */}
      <TableCell className="text-center text-xs tabular-nums hidden sm:table-cell">
        {player.turnovers}
      </TableCell>
      {/* FG */}
      <TableCell className="text-center text-xs tabular-nums">
        {formatShooting(player.fgm, player.fga)}
      </TableCell>
      {/* 3PM — hidden on mobile */}
      <TableCell className="text-center text-xs tabular-nums hidden sm:table-cell">
        {formatShooting(player.fg3m, player.fg3a)}
      </TableCell>
      {/* FTM — hidden on mobile */}
      <TableCell className="text-center text-xs tabular-nums hidden sm:table-cell">
        {formatShooting(player.ftm, player.fta)}
      </TableCell>
      {/* +/- — hidden on mobile */}
      <TableCell
        className={`text-center text-xs tabular-nums hidden sm:table-cell ${
          player.plusMinus > 0
            ? "text-green-600"
            : player.plusMinus < 0
              ? "text-red-600"
              : ""
        }`}
      >
        {player.plusMinus > 0 ? `+${player.plusMinus}` : player.plusMinus}
      </TableCell>
    </TableRow>
  );
}
