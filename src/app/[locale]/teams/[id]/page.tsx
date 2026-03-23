import { getTranslations, getLocale } from "next-intl/server";
import { db } from "@/db";
import { teams, players, games } from "@/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { RosterTable } from "@/components/teams/roster-table";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";

const homeTeams = alias(teams, "homeTeams");
const awayTeams = alias(teams, "awayTeams");

async function getTeam(id: string) {
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, id))
    .limit(1);
  return team || null;
}

async function getRoster(teamId: string) {
  return db
    .select({
      id: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      nameZh: players.nameZh,
      position: players.position,
      jerseyNumber: players.jerseyNumber,
      height: players.height,
      weight: players.weight,
      photoUrl: players.photoUrl,
      nbaDotComPlayerId: players.nbaDotComPlayerId,
    })
    .from(players)
    .where(eq(players.teamId, teamId));
}

async function getTeamGames(teamId: string) {
  return db
    .select({
      game: games,
      homeTeam: {
        id: homeTeams.id,
        name: homeTeams.name,
        nameZh: homeTeams.nameZh,
        abbreviation: homeTeams.abbreviation,
      },
      awayTeam: {
        id: awayTeams.id,
        name: awayTeams.name,
        nameZh: awayTeams.nameZh,
        abbreviation: awayTeams.abbreviation,
      },
    })
    .from(games)
    .innerJoin(homeTeams, eq(games.homeTeamId, homeTeams.id))
    .innerJoin(awayTeams, eq(games.awayTeamId, awayTeams.id))
    .where(or(eq(games.homeTeamId, teamId), eq(games.awayTeamId, teamId)))
    .orderBy(desc(games.startTime))
    .limit(10);
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("team");
  const locale = await getLocale();

  const team = await getTeam(id);
  if (!team) notFound();

  const [roster, teamGames] = await Promise.all([
    getRoster(id),
    getTeamGames(id),
  ]);

  const teamName = locale === "zh-TW" ? team.nameZh : team.name;

  const divisionLabels: Record<string, string> = locale === "zh-TW"
    ? { Atlantic: "大西洋組", Central: "中央組", Southeast: "東南組", Northwest: "西北組", Pacific: "太平洋組", Southwest: "西南組" }
    : { Atlantic: "Atlantic", Central: "Central", Southeast: "Southeast", Northwest: "Northwest", Pacific: "Pacific", Southwest: "Southwest" };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Team Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 border border-black/5"
        style={{ background: `linear-gradient(135deg, ${team.primaryColor ? '#' + team.primaryColor : '#1d6bff'}15, transparent 60%)` }}>
        <div className="flex items-center gap-4">
          {team.logoUrl && (
            <img
              src={team.logoUrl}
              alt={team.abbreviation}
              className="w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-lg"
            />
          )}
          <div>
            <h1 style={{ fontSize: "var(--text-h1)" }} className="font-bold">{teamName}</h1>
            <p className="text-muted-foreground">
              {team.abbreviation} · {team.conference === "East"
                ? locale === "zh-TW" ? "東區" : "Eastern Conference"
                : locale === "zh-TW" ? "西區" : "Western Conference"
              } · {divisionLabels[team.division] || team.division}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-t-2" style={{ borderTopColor: team.primaryColor ? '#' + team.primaryColor : undefined }}>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            {t("roster")}
          </h3>
          <p className="text-2xl font-bold">{roster.length}</p>
          <p className="text-xs text-muted-foreground">
            {locale === "zh-TW" ? "位球員" : "players"}
          </p>
        </Card>
        <Card className="p-4 border-t-2" style={{ borderTopColor: team.primaryColor ? '#' + team.primaryColor : undefined }}>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            {t("schedule")}
          </h3>
          <p className="text-2xl font-bold">{teamGames.length}</p>
          <p className="text-xs text-muted-foreground">
            {locale === "zh-TW" ? "場比賽" : "games"}
          </p>
        </Card>
        <Card className="p-4 border-t-2" style={{ borderTopColor: team.primaryColor ? '#' + team.primaryColor : undefined }}>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            {t("board")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {locale === "zh-TW" ? "還沒有討論・聊聊你的看法？" : "No discussions yet — share your thoughts?"}
          </p>
          <Link href={`/posts/new?teamId=${id}`} className="text-xs text-primary font-semibold hover:underline">
            {locale === "zh-TW" ? "發起討論 →" : "Start Discussion →"}
          </Link>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">
            {t("roster")} ({roster.length})
          </TabsTrigger>
          <TabsTrigger value="schedule">{t("schedule")}</TabsTrigger>
          <TabsTrigger value="board">{t("board")}</TabsTrigger>
        </TabsList>

        <TabsContent value="roster">
          {roster.length > 0 ? (
            <RosterTable players={roster} locale={locale} />
          ) : (
            <p className="text-sm text-muted-foreground p-4">
              {locale === "zh-TW"
                ? "球員資料尚未同步"
                : "Player data not yet synced"}
            </p>
          )}
        </TabsContent>

        <TabsContent value="schedule">
          {teamGames.length > 0 ? (
            <div className="space-y-2">
              {teamGames.map((row) => {
                const isHome = row.game.homeTeamId === id;
                const opponent = isHome ? row.awayTeam : row.homeTeam;
                const opponentName = locale === "zh-TW" ? opponent.nameZh : opponent.name;

                return (
                  <div
                    key={row.game.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-8">
                        {isHome
                          ? locale === "zh-TW" ? "主" : "vs"
                          : locale === "zh-TW" ? "客" : "@"}
                      </span>
                      <span className="text-sm font-medium">
                        {opponentName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {opponent.abbreviation}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {row.game.status === "final" ? (
                        <span className="text-sm tabular-nums font-medium">
                          {isHome
                            ? `${row.game.homeScore}-${row.game.awayScore}`
                            : `${row.game.awayScore}-${row.game.homeScore}`}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {new Date(row.game.startTime).toLocaleDateString(
                            locale === "zh-TW" ? "zh-TW" : "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground p-4">
              {locale === "zh-TW"
                ? "目前沒有賽程資料"
                : "No schedule data available"}
            </p>
          )}
        </TabsContent>

        <TabsContent value="board">
          <div className="p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              {locale === "zh-TW"
                ? "還沒有討論・聊聊你的看法？"
                : "No discussions yet — share your thoughts?"}
            </p>
            <Link href={`/posts/new?teamId=${id}`} className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all">
              {locale === "zh-TW" ? "發起討論 →" : "Start Discussion →"}
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
