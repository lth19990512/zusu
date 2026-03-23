import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameHeader } from "@/components/games/game-header";
import { BoxScoreTable } from "@/components/games/box-score-table";
import { TeamStatsComparison } from "@/components/games/team-stats-comparison";
import type { GameSummary, BoxScore } from "@/types/api";

async function fetchGame(id: string): Promise<{ game: GameSummary } | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/games/${id}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchBoxScore(id: string): Promise<BoxScore | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/games/${id}/boxscore`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("game");
  const locale = await getLocale();

  const [gameData, boxScore] = await Promise.all([
    fetchGame(id),
    fetchBoxScore(id),
  ]);

  if (!gameData) notFound();

  const { game } = gameData;
  const hasBoxScore = boxScore && (boxScore.homeTeam.players.length > 0 || boxScore.awayTeam.players.length > 0);
  const hasTeamStats = boxScore?.homeTeam.stats && boxScore?.awayTeam.stats;

  const isZh = locale === "zh-TW";
  const awayName = isZh ? game.awayTeam.nameZh : game.awayTeam.name;
  const homeName = isZh ? game.homeTeam.nameZh : game.homeTeam.name;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Game Header — scores + team logos */}
      <GameHeader game={game} locale={locale} />

      {/* Date info */}
      <p className="text-center text-xs text-muted-foreground -mt-4">
        {new Date(game.startTime).toLocaleDateString(
          isZh ? "zh-TW" : "en-US",
          { year: "numeric", month: "long", day: "numeric", weekday: "short" }
        )}
      </p>

      {/* Tabs */}
      <Tabs defaultValue="boxscore">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="boxscore">{t("boxScore")}</TabsTrigger>
          <TabsTrigger value="teamstats">{t("teamStats")}</TabsTrigger>
          <TabsTrigger value="discussion">{t("gameThread")}</TabsTrigger>
        </TabsList>

        {/* Box Score */}
        <TabsContent value="boxscore" className="space-y-6">
          {hasBoxScore ? (
            <>
              {/* Away team box score */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  {boxScore.awayTeam.team.logoUrl && (
                    <img src={boxScore.awayTeam.team.logoUrl} alt="" className="w-5 h-5 object-contain" />
                  )}
                  {awayName}
                  {game.status === "final" && (
                    <span className="text-muted-foreground font-normal ml-1">{game.awayScore}</span>
                  )}
                </h3>
                <BoxScoreTable players={boxScore.awayTeam.players} />
              </div>

              {/* Home team box score */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  {boxScore.homeTeam.team.logoUrl && (
                    <img src={boxScore.homeTeam.team.logoUrl} alt="" className="w-5 h-5 object-contain" />
                  )}
                  {homeName}
                  {game.status === "final" && (
                    <span className="text-muted-foreground font-normal ml-1">{game.homeScore}</span>
                  )}
                </h3>
                <BoxScoreTable players={boxScore.homeTeam.players} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground p-6 text-center">
              {isZh ? "尚無 Box Score 數據" : "No box score data available"}
            </p>
          )}
        </TabsContent>

        {/* Team Stats Comparison */}
        <TabsContent value="teamstats">
          {hasTeamStats ? (
            <div className="max-w-md mx-auto p-4">
              <TeamStatsComparison
                homeTeam={boxScore.homeTeam.team}
                awayTeam={boxScore.awayTeam.team}
                homeStats={boxScore.homeTeam.stats!}
                awayStats={boxScore.awayTeam.stats!}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground p-6 text-center">
              {isZh ? "尚無球隊數據" : "No team stats available"}
            </p>
          )}
        </TabsContent>

        {/* Game Thread */}
        <TabsContent value="discussion">
          <div className="p-6 text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              {isZh ? "在社群討論這場比賽" : "Discuss this game in the community"}
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href={`/zh-TW/posts/new?gameId=${id}`}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all"
              >
                {isZh ? "發起討論" : "Start Discussion"}
              </a>
              <a
                href="/zh-TW/posts"
                className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors"
              >
                {isZh ? "查看社群" : "View Community"}
              </a>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
