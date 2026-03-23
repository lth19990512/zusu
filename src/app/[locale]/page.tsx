import { getTranslations, getLocale } from "next-intl/server";
import { db } from "@/db";
import { games, teams, posts, users } from "@/db/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { PlayerLeaderboard } from "@/components/shared/player-leaderboard";
import { HeroCarousel } from "@/components/shared/hero-carousel";
import { EmptyState } from "@/components/shared/empty-state";
import { Link } from "@/i18n/navigation";

const homeTeams = alias(teams, "homeTeams");
const awayTeams = alias(teams, "awayTeams");

async function getTodayGames() {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const rows = await db
    .select({ game: games, homeTeam: { id: homeTeams.id, name: homeTeams.name, nameZh: homeTeams.nameZh, abbreviation: homeTeams.abbreviation, logoUrl: homeTeams.logoUrl }, awayTeam: { id: awayTeams.id, name: awayTeams.name, nameZh: awayTeams.nameZh, abbreviation: awayTeams.abbreviation, logoUrl: awayTeams.logoUrl } })
    .from(games)
    .innerJoin(homeTeams, eq(games.homeTeamId, homeTeams.id))
    .innerJoin(awayTeams, eq(games.awayTeamId, awayTeams.id))
    .where(sql`DATE(${games.startTime} AT TIME ZONE 'America/New_York') = ${today}`)
    .orderBy(games.startTime);
  return rows.map((r) => ({ id: r.game.id, startTime: r.game.startTime.toISOString(), status: r.game.status, period: r.game.period, clock: r.game.clock, homeTeam: r.homeTeam, awayTeam: r.awayTeam, homeScore: r.game.homeScore, awayScore: r.game.awayScore }));
}

async function getRecentGames(limit = 8) {
  const rows = await db
    .select({ game: games, homeTeam: { id: homeTeams.id, name: homeTeams.name, nameZh: homeTeams.nameZh, abbreviation: homeTeams.abbreviation, logoUrl: homeTeams.logoUrl }, awayTeam: { id: awayTeams.id, name: awayTeams.name, nameZh: awayTeams.nameZh, abbreviation: awayTeams.abbreviation, logoUrl: awayTeams.logoUrl } })
    .from(games)
    .innerJoin(homeTeams, eq(games.homeTeamId, homeTeams.id))
    .innerJoin(awayTeams, eq(games.awayTeamId, awayTeams.id))
    .where(eq(games.status, "final"))
    .orderBy(desc(games.startTime))
    .limit(limit);
  return rows.map((r) => ({ id: r.game.id, startTime: r.game.startTime.toISOString(), status: r.game.status, homeTeam: r.homeTeam, awayTeam: r.awayTeam, homeScore: r.game.homeScore, awayScore: r.game.awayScore }));
}

async function getTrendingPosts(limit = 5) {
  return db.select({ id: posts.id, title: posts.title, type: posts.type, likeCount: posts.likeCount, commentCount: posts.commentCount, viewCount: posts.viewCount, createdAt: posts.createdAt, authorName: users.displayName, teamAbbr: teams.abbreviation, teamLogo: teams.logoUrl })
    .from(posts).innerJoin(users, eq(posts.authorId, users.id)).leftJoin(teams, eq(posts.teamId, teams.id))
    .where(and(eq(posts.isDeleted, false)))
    .orderBy(desc(sql`(${posts.likeCount} * 2 + ${posts.commentCount} * 3)`), desc(posts.createdAt)).limit(limit);
}

async function getAllTeams() {
  return db.select({ id: teams.id, name: teams.name, nameZh: teams.nameZh, abbreviation: teams.abbreviation, logoUrl: teams.logoUrl, conference: teams.conference })
    .from(teams).orderBy(teams.conference, teams.name);
}

export default async function HomePage() {
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();
  const isZh = locale === "zh-TW";

  const [todayGames, recentGames, allTeams, trendingPosts] = await Promise.all([
    getTodayGames(), getRecentGames(), getAllTeams(), getTrendingPosts(),
  ]);

  const featuredGame = todayGames[0] || null;
  const scoreboard = todayGames.length > 0 ? todayGames : recentGames;

  return (
    <div className="container mx-auto px-4 py-5 space-y-5">

      {/* ===== HERO CAROUSEL ===== */}
      <HeroCarousel
        featuredGame={featuredGame}
        topScorer={{ name: "Jayson Tatum", stat: 31.1, unit: "PPG", team: "Boston Celtics" }}
        heroTitle={t("heroTitle")}
        heroDescription={t("heroDescription")}
      />

      {/* ===== SCORES + SIDEBAR ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Live Scores — Table style */}
        <section className="rounded-2xl bg-card border border-black/5 overflow-hidden animate-enter animate-enter-d1">
          {/* Date tabs bar */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <div className="flex gap-2">
              {[isZh ? "昨天" : "Yesterday", isZh ? "今天" : "Today", isZh ? "明天" : "Tomorrow"].map((label, i) => (
                <span key={label} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${i === 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Live Games header */}
          <div className="flex items-center gap-2 px-5 pb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <h2 className="font-bold text-sm uppercase tracking-wider" style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif" }}>
              {todayGames.length > 0 ? (isZh ? "即時比分" : "Live Games") : (isZh ? "近期賽事" : "Recent Games")}
            </h2>
          </div>

          {/* Scoreboard list */}
          {scoreboard.length > 0 ? (
            <div>
              {scoreboard.map((game, idx) => {
                const awayWin = game.homeScore < game.awayScore;
                const homeWin = game.homeScore > game.awayScore;
                const isHighlighted = idx === 0; // first game highlighted
                return (
                  <Link key={game.id} href={`/games/${game.id}`}>
                    <div className={`flex items-center gap-3 py-2.5 px-5 transition-colors hover:bg-muted/50 border-b border-black/5 ${isHighlighted ? "bg-primary/5 border-l-[3px] border-l-primary" : ""}`}>
                      {/* Away team */}
                      <div className="flex items-center gap-2 w-28 min-w-0">
                        {game.awayTeam.logoUrl && <img src={game.awayTeam.logoUrl} alt="" className="w-5 h-5 object-contain shrink-0" />}
                        <span className={`text-sm truncate ${awayWin ? "font-bold" : ""}`}>
                          {game.awayTeam.abbreviation}
                        </span>
                      </div>
                      {/* Scores */}
                      <div className="flex items-center gap-1.5 tabular-nums w-20 justify-center" style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif" }}>
                        <span className={`text-base ${awayWin ? "font-bold" : "text-muted-foreground"}`}>{game.awayScore}</span>
                        <span className={`text-base ${homeWin ? "font-bold" : "text-muted-foreground"}`}>{game.homeScore}</span>
                      </div>
                      {/* Home team */}
                      <div className="flex items-center gap-2 w-28 min-w-0">
                        {game.homeTeam.logoUrl && <img src={game.homeTeam.logoUrl} alt="" className="w-5 h-5 object-contain shrink-0" />}
                        <span className={`text-sm truncate ${homeWin ? "font-bold" : ""}`}>
                          {game.homeTeam.abbreviation}
                        </span>
                      </div>
                      {/* Status */}
                      <span className="text-[10px] text-muted-foreground ml-auto uppercase tracking-wider">
                        {game.status === "final" ? "Final" : game.status === "live" ? "LIVE" : new Date(game.startTime).toLocaleTimeString(isZh ? "zh-TW" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-6 px-5">
              <EmptyState icon="basketball" title={isZh ? "今日暫無賽事" : "No games today"} description={isZh ? "請查看球隊頁面" : "Check team pages"} />
            </div>
          )}

          {/* Bottom bar: tabs + view all */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-black/5 bg-muted/30">
            <div className="flex gap-2">
              {["Box Score", isZh ? "投籃圖" : "Shot Chart", isZh ? "即將開始" : "Upcoming"].map((tab, i) => (
                <span key={tab} className={`px-3 py-1 rounded-lg text-[11px] font-medium ${i === 0 ? "bg-card border border-black/10 text-foreground" : "text-muted-foreground hover:text-foreground cursor-pointer"}`}>
                  {tab}
                </span>
              ))}
            </div>
            <Link href="/games" className="text-xs text-primary font-bold uppercase tracking-wider hover:underline">
              {isZh ? "全部賽事 →" : "VIEW ALL SCORES →"}
            </Link>
          </div>
        </section>

        {/* Sidebar — My Team style */}
        <aside className="hidden lg:flex flex-col gap-4 animate-enter animate-enter-d2">
          {/* My Team Card */}
          <div className="rounded-2xl bg-card border border-black/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider" style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif" }}>My Team</h3>
              <span className="text-primary text-xs">🔥</span>
            </div>

            {/* Featured team (first team as demo) */}
            {allTeams[0] && (
              <Link href={`/teams/${allTeams[0].id}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 mb-3">
                  {allTeams[0].logoUrl && <img src={allTeams[0].logoUrl} alt="" className="w-10 h-10 object-contain" />}
                  <div>
                    <p className="font-bold text-sm">{isZh ? allTeams[0].nameZh : allTeams[0].name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{allTeams[0].conference}</p>
                  </div>
                </div>
              </Link>
            )}

            {/* Season Leaders mock */}
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Season Leaders</p>
            <div className="space-y-2">
              {[
                { name: "LeBron", stat: "27.4", label: "PPG" },
                { name: "Anthony", stat: "12.3", label: "RPG" },
                { name: "D'Angelo", stat: "7.8", label: "APG" },
              ].map((player) => (
                <div key={player.name} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      {player.name[0]}
                    </div>
                    <span className="text-xs font-medium">{player.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold" style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif" }}>{player.stat}</span>
                    <span className="text-[9px] text-muted-foreground ml-1">{player.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/games" className="mt-3 block text-center py-2 rounded-lg border border-primary text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/5 transition-colors">
              {isZh ? "查看全部賽事" : "VIEW ALL SCORES"}
            </Link>
          </div>

          {/* Trending posts */}
          <div className="rounded-2xl bg-card border border-black/5 p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider" style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif" }}>{isZh ? "熱門討論" : "Trending"}</h3>
              <Link href="/posts" className="text-[10px] text-primary font-semibold hover:underline uppercase">{isZh ? "更多 →" : "More →"}</Link>
            </div>
            {trendingPosts.length > 0 ? (
              <div className="space-y-2">
                {trendingPosts.slice(0, 4).map((post) => (
                  <Link key={post.id} href={`/posts/${post.id}`}>
                    <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      {post.teamLogo && <img src={post.teamLogo} alt="" className="w-5 h-5 object-contain mt-0.5 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-xs font-medium line-clamp-2 leading-snug">{post.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{post.authorName} · ❤ {post.likeCount} · 💬 {post.commentCount}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">{isZh ? "還沒有討論" : "No discussions yet"}</p>
            )}
          </div>
        </aside>
      </div>

      {/* ===== BOTTOM: Leaderboard + News ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-enter animate-enter-d3">
        {/* Player Leaderboard */}
        <section className="rounded-2xl bg-card border border-black/5 p-5">
          <PlayerLeaderboard />
        </section>

        {/* News & Social */}
        <section className="rounded-2xl bg-card border border-black/5 p-5">
          <h2 className="font-bold uppercase tracking-wide mb-4" style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontSize: "var(--font-h2)" }}>
            {isZh ? "社群 & 新聞" : "NEWS & Social"}
          </h2>

          {trendingPosts.length > 0 ? (
            <div className="space-y-3">
              {/* Featured post (first one as big card) */}
              <Link href={`/posts/${trendingPosts[0].id}`}>
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-secondary/5 p-4 card-hover">
                  <div className="flex items-center gap-2 mb-2">
                    {trendingPosts[0].teamLogo && <img src={trendingPosts[0].teamLogo} alt="" className="w-6 h-6 object-contain" />}
                    <span className="text-xs text-muted-foreground">{trendingPosts[0].authorName}</span>
                  </div>
                  <h3 className="font-bold text-base leading-snug mb-2">{trendingPosts[0].title}</h3>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>❤ {trendingPosts[0].likeCount}</span>
                    <span>💬 {trendingPosts[0].commentCount}</span>
                    <span>👁 {trendingPosts[0].viewCount}</span>
                  </div>
                </div>
              </Link>
              {/* Rest as list */}
              {trendingPosts.slice(1).map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`}>
                  <div className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-muted/50 transition-colors">
                    {post.teamLogo && <img src={post.teamLogo} alt="" className="w-6 h-6 object-contain shrink-0" />}
                    <p className="text-sm font-medium flex-1 truncate">{post.title}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">❤ {post.likeCount}</span>
                  </div>
                </Link>
              ))}
              <Link href="/posts" className="block text-center text-xs text-primary font-semibold hover:underline uppercase tracking-wider pt-2">
                {isZh ? "更多社群動態 →" : "MORE ACTIVITY →"}
              </Link>
            </div>
          ) : (
            <EmptyState icon="chat" title={isZh ? "還沒有貼文" : "No posts yet"} description={isZh ? "成為第一個發文的人！" : "Be the first to post!"} />
          )}
        </section>
      </div>

      {/* ===== TEAMS ROW — Mobile only ===== */}
      <section className="lg:hidden animate-enter animate-enter-d4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold" style={{ fontSize: "var(--font-h2)" }}>{tNav("teams")}</h2>
          <Link href="/teams" className="text-sm text-primary hover:underline">{isZh ? "全部 →" : "All →"}</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          {allTeams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <div className="shrink-0 w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted hover:scale-110 transition-all border border-black/5" title={isZh ? team.nameZh : team.name}>
                {team.logoUrl ? <img src={team.logoUrl} alt={team.abbreviation} className="w-8 h-8 object-contain" /> : <span className="text-[10px] font-bold">{team.abbreviation}</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
