import { getTranslations, getLocale } from "next-intl/server";
import { db } from "@/db";
import { games, teams } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { ScoreCard } from "@/components/games/score-card";
import { EmptyState } from "@/components/shared/empty-state";

const homeTeams = alias(teams, "homeTeams");
const awayTeams = alias(teams, "awayTeams");

async function getRecentGames() {
  const rows = await db
    .select({
      game: games,
      homeTeam: {
        id: homeTeams.id,
        name: homeTeams.name,
        nameZh: homeTeams.nameZh,
        abbreviation: homeTeams.abbreviation,
        logoUrl: homeTeams.logoUrl,
      },
      awayTeam: {
        id: awayTeams.id,
        name: awayTeams.name,
        nameZh: awayTeams.nameZh,
        abbreviation: awayTeams.abbreviation,
        logoUrl: awayTeams.logoUrl,
      },
    })
    .from(games)
    .innerJoin(homeTeams, eq(games.homeTeamId, homeTeams.id))
    .innerJoin(awayTeams, eq(games.awayTeamId, awayTeams.id))
    .orderBy(desc(games.startTime))
    .limit(30);

  return rows.map((row) => ({
    id: row.game.id,
    startTime: row.game.startTime.toISOString(),
    status: row.game.status,
    period: row.game.period,
    clock: row.game.clock,
    homeTeam: row.homeTeam,
    awayTeam: row.awayTeam,
    homeScore: row.game.homeScore,
    awayScore: row.game.awayScore,
  }));
}

export default async function GamesPage() {
  const t = await getTranslations("home");
  const locale = await getLocale();
  const recentGames = await getRecentGames();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 style={{ fontSize: "var(--text-h1)" }} className="font-bold mb-6">{t("todayGames")}</h1>

      {/* Date navigation bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
          const d = new Date();
          d.setDate(d.getDate() + offset);
          const label = offset === 0
            ? (locale === "zh-TW" ? "今天" : "Today")
            : d.toLocaleDateString(locale === "zh-TW" ? "zh-TW" : "en-US", { month: "short", day: "numeric" });
          return (
            <button key={offset} className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${offset === 0 ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
              {label}
            </button>
          );
        })}
      </div>

      {recentGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentGames.map((game) => (
            <ScoreCard key={game.id} game={game} locale={locale} />
          ))}
        </div>
      ) : (
        <EmptyState icon="trophy" title={locale === "zh-TW" ? "今日暫無賽事・查看近期賽程" : "No games scheduled today"} />
      )}
    </div>
  );
}
