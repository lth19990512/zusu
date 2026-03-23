"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { GameSummary } from "@/types/api";

export function GameHeader({
  game,
  locale,
}: {
  game: GameSummary;
  locale: string;
}) {
  const t = useTranslations("game");
  const isLive = game.status === "live";
  const isFinal = game.status === "final";
  const showScore = isLive || isFinal;

  const getName = (team: GameSummary["homeTeam"]) =>
    locale === "zh-TW" ? team.nameZh : team.name;

  return (
    <div className="bg-card border rounded-lg p-6">
      {/* Status bar */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {isLive && (
          <Badge className="bg-red-600 text-white animate-pulse">
            {t("live")}
          </Badge>
        )}
        {isFinal && <Badge variant="secondary">{t("final")}</Badge>}
        {game.status === "scheduled" && (
          <span className="text-sm text-muted-foreground">
            {new Date(game.startTime).toLocaleString(
              locale === "zh-TW" ? "zh-TW" : "en-US",
              {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </span>
        )}
        {isLive && game.period > 0 && (
          <span className="text-sm text-muted-foreground">
            {game.period <= 4 ? t("quarter", { quarter: game.period }) : t("overtime")}
            {game.clock && ` · ${game.clock}`}
          </span>
        )}
      </div>

      {/* Teams + Score */}
      <div className="flex items-center justify-center gap-8">
        {/* Away Team */}
        <div className="flex flex-col items-center gap-2 min-w-[100px]">
          {game.awayTeam.logoUrl && (
            <img
              src={game.awayTeam.logoUrl}
              alt={game.awayTeam.abbreviation}
              className="w-16 h-16 object-contain"
            />
          )}
          <span className="font-semibold text-center">
            {getName(game.awayTeam)}
          </span>
          <span className="text-xs text-muted-foreground">
            {game.awayTeam.abbreviation}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-4">
          {showScore ? (
            <>
              <span
                className={`text-4xl font-bold tabular-nums ${
                  isFinal && game.awayScore < game.homeScore
                    ? "text-muted-foreground"
                    : ""
                }`}
              >
                {game.awayScore}
              </span>
              <span className="text-2xl text-muted-foreground">-</span>
              <span
                className={`text-4xl font-bold tabular-nums ${
                  isFinal && game.homeScore < game.awayScore
                    ? "text-muted-foreground"
                    : ""
                }`}
              >
                {game.homeScore}
              </span>
            </>
          ) : (
            <span className="text-2xl text-muted-foreground">vs</span>
          )}
        </div>

        {/* Home Team */}
        <div className="flex flex-col items-center gap-2 min-w-[100px]">
          {game.homeTeam.logoUrl && (
            <img
              src={game.homeTeam.logoUrl}
              alt={game.homeTeam.abbreviation}
              className="w-16 h-16 object-contain"
            />
          )}
          <span className="font-semibold text-center">
            {getName(game.homeTeam)}
          </span>
          <span className="text-xs text-muted-foreground">
            {game.homeTeam.abbreviation}
          </span>
        </div>
      </div>
    </div>
  );
}
