"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GameSummary } from "@/types/api";

function StatusBadge({ status }: { status: GameSummary["status"] }) {
  const t = useTranslations("game");

  switch (status) {
    case "live":
      return (
        <Badge className="bg-red-600/20 text-red-400 border border-red-500/30 gap-1.5">
          <span className="size-1.5 rounded-full bg-red-500 animate-pulse-live" />
          {t("live")}
        </Badge>
      );
    case "final":
      return <Badge variant="secondary">{t("final")}</Badge>;
    case "postponed":
      return <Badge variant="outline">{t("postponed")}</Badge>;
    default:
      return <Badge variant="outline">{t("scheduled")}</Badge>;
  }
}

function formatTime(dateStr: string, locale: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale === "zh-TW" ? "zh-TW" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScoreCard({
  game,
  locale,
}: {
  game: GameSummary;
  locale: string;
}) {
  const isLive = game.status === "live";
  const isFinal = game.status === "final";
  const showScore = isLive || isFinal;

  return (
    <Link href={`/games/${game.id}`}>
      <Card
        className={`p-4 card-hover cursor-pointer ${
          isLive ? "ring-1 ring-red-500/30" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <StatusBadge status={game.status} />
          {isLive && game.clock && (
            <span className="text-xs text-muted-foreground font-mono">
              {game.clock}
            </span>
          )}
          {!showScore && (
            <span className="text-xs text-muted-foreground">
              {formatTime(game.startTime, locale)}
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2 min-w-0">
            {game.awayTeam.logoUrl && (
              <img
                src={game.awayTeam.logoUrl}
                alt={game.awayTeam.abbreviation}
                className="w-8 h-8 object-contain"
              />
            )}
            <span className="font-medium truncate text-sm">
              {locale === "zh-TW"
                ? game.awayTeam.nameZh
                : game.awayTeam.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {game.awayTeam.abbreviation}
            </span>
          </div>
          {showScore && (
            <span
              style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif" }} className={`text-lg font-bold tabular-nums ${
                isFinal && game.awayScore > game.homeScore
                  ? "text-foreground"
                  : isFinal
                    ? "text-muted-foreground"
                    : ""
              }`}
            >
              {game.awayScore}
            </span>
          )}
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2 min-w-0">
            {game.homeTeam.logoUrl && (
              <img
                src={game.homeTeam.logoUrl}
                alt={game.homeTeam.abbreviation}
                className="w-8 h-8 object-contain"
              />
            )}
            <span className="font-medium truncate text-sm">
              {locale === "zh-TW"
                ? game.homeTeam.nameZh
                : game.homeTeam.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {game.homeTeam.abbreviation}
            </span>
          </div>
          {showScore && (
            <span
              style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif" }} className={`text-lg font-bold tabular-nums ${
                isFinal && game.homeScore > game.awayScore
                  ? "text-foreground"
                  : isFinal
                    ? "text-muted-foreground"
                    : ""
              }`}
            >
              {game.homeScore}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
