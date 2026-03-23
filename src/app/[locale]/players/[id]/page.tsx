import { getTranslations, getLocale } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShotChart } from "@/components/players/shot-chart";
import { notFound } from "next/navigation";

interface PlayerTeam {
  id: string;
  name: string;
  nameZh: string;
  abbreviation: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

interface PlayerData {
  id: string;
  firstName: string;
  lastName: string;
  nameZh: string | null;
  position: string | null;
  jerseyNumber: string | null;
  height: string | null;
  weight: string | null;
  birthDate: string | null;
  birthCity: string | null;
  birthCountry: string | null;
  college: string | null;
  draftYear: number | null;
  draftRound: number | null;
  draftNumber: number | null;
  experience: number | null;
  salary: number | null;
  photoUrl: string | null;
  team: PlayerTeam | null;
}

interface SeasonStats {
  gamesPlayed: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  mpg: number;
  fgPct: number;
  fg3Pct: number;
  ftPct: number;
}

interface RecentGame {
  date: string;
  opponent: { abbreviation: string; name: string };
  points: number | null;
  rebounds: number | null;
  assists: number | null;
  minutes: string | null;
  fgm: number | null;
  fga: number | null;
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

async function getPlayerData(id: string) {
  const res = await fetch(`${getBaseUrl()}/api/players/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json() as Promise<{
    player: PlayerData;
    seasonStats: SeasonStats | null;
    recentGames: RecentGame[];
  }>;
}

interface ShotZoneApiData {
  zoneId: string;
  name: string;
  nameZh: string;
  fgm: number;
  fga: number;
  fgPct: number;
  leagueAvgPct: number;
}

interface IndividualShotApi {
  x: number;
  y: number;
  made: boolean;
  shotType: string | null;
  quarter: string | null;
  gameId: string | null;
}

async function getShotData(id: string) {
  try {
    const [zoneRes, scatterRes] = await Promise.all([
      fetch(`${getBaseUrl()}/api/players/${id}/shots?mode=zone`, {
        cache: "no-store",
      }),
      fetch(`${getBaseUrl()}/api/players/${id}/shots?mode=scatter&limit=500`, {
        cache: "no-store",
      }),
    ]);

    const zoneData = zoneRes.ok
      ? (await zoneRes.json()) as { zones: ShotZoneApiData[] | null; hasData: boolean }
      : null;
    const scatterData = scatterRes.ok
      ? (await scatterRes.json()) as { shots: IndividualShotApi[]; total: number }
      : null;

    return {
      zones: zoneData?.hasData ? zoneData.zones : null,
      shots: scatterData?.shots ?? null,
      hasData: zoneData?.hasData ?? false,
    };
  } catch {
    return { zones: null, shots: null, hasData: false };
  }
}

function formatSalary(salary: number | null): string {
  if (!salary) return "-";
  return "$" + salary.toLocaleString("en-US");
}

function formatDraft(
  year: number | null,
  round: number | null,
  number: number | null,
  locale: string,
  undraftedLabel: string
): string {
  if (!year) return undraftedLabel;
  return `${year} ${locale === "zh-TW" ? `第${round}輪` : `Round ${round}`}, Pick ${number}`;
}

function PlayerInitials({
  firstName,
  lastName,
  size = "lg",
}: {
  firstName: string;
  lastName: string;
  size?: "sm" | "lg";
}) {
  const sizeClasses =
    size === "lg"
      ? "w-[200px] h-[200px] text-4xl"
      : "w-12 h-12 text-sm";
  return (
    <div
      className={`${sizeClasses} rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground`}
    >
      {firstName[0]}
      {lastName[0]}
    </div>
  );
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("player");
  const locale = await getLocale();

  const [data, shotData] = await Promise.all([
    getPlayerData(id),
    getShotData(id),
  ]);
  if (!data) notFound();

  const { player, seasonStats, recentGames } = data;
  const teamColor = player.team?.primaryColor || "#1d6bff";
  const teamColor2 = player.team?.secondaryColor || teamColor;

  const playerName =
    locale === "zh-TW" && player.nameZh
      ? player.nameZh
      : `${player.firstName} ${player.lastName}`;

  const teamName = player.team
    ? locale === "zh-TW" ? player.team.nameZh : player.team.name
    : "";

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Hero Banner */}
      <section
        className="relative overflow-hidden rounded-2xl"
        style={{ backgroundColor: teamColor, minHeight: 220 }}
      >
        {/* Subtle sweeping arcs — like NBA.com */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -right-[20%] -top-[60%] w-[70%] h-[200%] rounded-full"
            style={{ background: `radial-gradient(ellipse, ${teamColor2}30, transparent 70%)` }}
          />
          <div
            className="absolute -left-[10%] -bottom-[80%] w-[60%] h-[200%] rounded-full"
            style={{ background: `radial-gradient(ellipse, white, transparent 70%)`, opacity: 0.03 }}
          />
        </div>

        {/* Team logo watermark */}
        {player.team?.logoUrl && (
          <img
            src={player.team.logoUrl}
            alt=""
            className="absolute top-4 left-6 w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg opacity-90"
          />
        )}

        {/* Content layout */}
        <div className="relative flex items-end gap-4 md:gap-8 px-4 md:px-8 pt-6 pb-0">
          {/* Player photo — bottom-aligned, overlapping */}
          {player.photoUrl ? (
            <div className="flex-shrink-0 -mb-0 self-end">
              <img
                src={player.photoUrl}
                alt={playerName}
                className="h-[220px] md:h-[280px] w-auto object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 mb-4">
              <PlayerInitials
                firstName={player.firstName}
                lastName={player.lastName}
              />
            </div>
          )}

          {/* Info block */}
          <div className="flex-1 pb-5 md:pb-7 min-w-0">
            {/* Team | Number | Position */}
            <p className="text-white/70 text-sm md:text-base mb-1 truncate">
              {[teamName, player.jerseyNumber ? `#${player.jerseyNumber}` : null, player.position]
                .filter(Boolean)
                .join(" | ")}
            </p>

            {/* Player name — huge */}
            <h1
              className="text-white font-bold uppercase leading-[0.95] tracking-wide"
              style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontSize: "clamp(2rem, 6vw, 4.5rem)" }}
            >
              {locale === "zh-TW" && player.nameZh ? (
                player.nameZh
              ) : (
                <>
                  <span className="block">{player.firstName}</span>
                  <span className="block">{player.lastName}</span>
                </>
              )}
            </h1>

            {/* Quick stats */}
            {seasonStats && (
              <div className="flex items-center gap-5 md:gap-8 mt-3">
                {[
                  { val: seasonStats.ppg, label: t("ppg") },
                  { val: seasonStats.rpg, label: t("rpg") },
                  { val: seasonStats.apg, label: t("apg") },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-white text-xl md:text-2xl font-bold" style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif" }}>
                      {s.val}
                    </p>
                    <p className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow button */}
          <div className="hidden md:flex flex-shrink-0 pb-7 self-center">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-white/60 text-white text-sm font-semibold hover:bg-black/10 transition-colors">
              <span className="text-base">☆</span>
              FOLLOW
            </button>
          </div>
        </div>
      </section>

      {/* Bio Section */}
      <Card className="p-5">
        <h2
          style={{ fontSize: "var(--text-h2)" }}
          className="font-semibold mb-4"
        >
          {t("bio")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {player.birthDate && (
            <div>
              <span className="text-muted-foreground">{t("birthDate")}: </span>
              <span>{player.birthDate}</span>
            </div>
          )}
          {(player.birthCity || player.birthCountry) && (
            <div>
              <span className="text-muted-foreground">
                {t("birthPlace")}:{" "}
              </span>
              <span>
                {[player.birthCity, player.birthCountry]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}
          {player.college && (
            <div>
              <span className="text-muted-foreground">{t("college")}: </span>
              <span>{player.college}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">{t("draft")}: </span>
            <span>
              {formatDraft(
                player.draftYear,
                player.draftRound,
                player.draftNumber,
                locale,
                t("undrafted")
              )}
            </span>
          </div>
          {player.experience != null && (
            <div>
              <span className="text-muted-foreground">
                {t("experience")}:{" "}
              </span>
              <span>
                {player.experience} {t("years")}
              </span>
            </div>
          )}
          {player.height && (
            <div>
              <span className="text-muted-foreground">
                {locale === "zh-TW" ? "身高" : "Height"}:{" "}
              </span>
              <span>{player.height}</span>
            </div>
          )}
          {player.weight && (
            <div>
              <span className="text-muted-foreground">
                {locale === "zh-TW" ? "體重" : "Weight"}:{" "}
              </span>
              <span>{player.weight}</span>
            </div>
          )}
          {player.salary && (
            <div>
              <span className="text-muted-foreground">{t("salary")}: </span>
              <span>{formatSalary(player.salary)}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Season Stats */}
      <Card className="p-5">
        <h2
          style={{ fontSize: "var(--text-h2)" }}
          className="font-semibold mb-4"
        >
          {t("seasonStats")}
        </h2>
        {seasonStats ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-muted-foreground">
                  <th className="text-center py-2 px-2 font-medium">
                    {t("gamesPlayed")}
                  </th>
                  <th className="text-center py-2 px-2 font-medium">
                    {t("ppg")}
                  </th>
                  <th className="text-center py-2 px-2 font-medium">
                    {t("rpg")}
                  </th>
                  <th className="text-center py-2 px-2 font-medium">
                    {t("apg")}
                  </th>
                  <th className="text-center py-2 px-2 font-medium hidden sm:table-cell">
                    {t("spg")}
                  </th>
                  <th className="text-center py-2 px-2 font-medium hidden sm:table-cell">
                    {t("bpg")}
                  </th>
                  <th className="text-center py-2 px-2 font-medium">
                    {t("fgPct")}
                  </th>
                  <th className="text-center py-2 px-2 font-medium hidden sm:table-cell">
                    {t("fg3Pct")}
                  </th>
                  <th className="text-center py-2 px-2 font-medium hidden sm:table-cell">
                    {t("ftPct")}
                  </th>
                  <th className="text-center py-2 px-2 font-medium hidden sm:table-cell">
                    {t("mpg")}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-center">
                  <td className="py-2 px-2 tabular-nums font-medium">
                    {seasonStats.gamesPlayed}
                  </td>
                  <td className="py-2 px-2 tabular-nums font-medium">
                    {seasonStats.ppg}
                  </td>
                  <td className="py-2 px-2 tabular-nums">
                    {seasonStats.rpg}
                  </td>
                  <td className="py-2 px-2 tabular-nums">
                    {seasonStats.apg}
                  </td>
                  <td className="py-2 px-2 tabular-nums hidden sm:table-cell">
                    {seasonStats.spg}
                  </td>
                  <td className="py-2 px-2 tabular-nums hidden sm:table-cell">
                    {seasonStats.bpg}
                  </td>
                  <td className="py-2 px-2 tabular-nums">
                    {seasonStats.fgPct}%
                  </td>
                  <td className="py-2 px-2 tabular-nums hidden sm:table-cell">
                    {seasonStats.fg3Pct}%
                  </td>
                  <td className="py-2 px-2 tabular-nums hidden sm:table-cell">
                    {seasonStats.ftPct}%
                  </td>
                  <td className="py-2 px-2 tabular-nums hidden sm:table-cell">
                    {seasonStats.mpg}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noStats")}</p>
        )}
      </Card>

      {/* Shot Chart */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <h2
            style={{ fontSize: "var(--text-h2)" }}
            className="font-semibold"
          >
            {t("shotChart")}
          </h2>
          {!shotData.hasData && (
            <span className="text-xs text-muted-foreground">
              {t("mockData")}
            </span>
          )}
        </div>
        <ShotChart
          position={player.position}
          locale={locale}
          zones={shotData.zones ?? undefined}
          shots={shotData.shots ?? undefined}
          teamAbbreviation={player.team?.abbreviation}
        />
      </Card>

      {/* Recent Games */}
      <Card className="p-5">
        <h2
          style={{ fontSize: "var(--text-h2)" }}
          className="font-semibold mb-4"
        >
          {t("recentGames")}
        </h2>
        {recentGames.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-muted-foreground">
                  <th className="text-left py-2 px-2 font-medium">
                    {locale === "zh-TW" ? "日期" : "Date"}
                  </th>
                  <th className="text-left py-2 px-2 font-medium">
                    {locale === "zh-TW" ? "對手" : "OPP"}
                  </th>
                  <th className="text-center py-2 px-2 font-medium">MIN</th>
                  <th className="text-center py-2 px-2 font-medium">PTS</th>
                  <th className="text-center py-2 px-2 font-medium">REB</th>
                  <th className="text-center py-2 px-2 font-medium">AST</th>
                  <th className="text-center py-2 px-2 font-medium">FG</th>
                </tr>
              </thead>
              <tbody>
                {recentGames.map((game, i) => (
                  <tr
                    key={i}
                    className="border-b border-black/5 hover:bg-black/5"
                  >
                    <td className="py-1.5 px-2 text-muted-foreground">
                      {new Date(game.date).toLocaleDateString(
                        locale === "zh-TW" ? "zh-TW" : "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </td>
                    <td className="py-1.5 px-2 font-medium">
                      {game.opponent.abbreviation}
                    </td>
                    <td className="text-center py-1.5 px-2 tabular-nums">
                      {game.minutes ?? "-"}
                    </td>
                    <td className="text-center py-1.5 px-2 tabular-nums font-medium">
                      {game.points ?? "-"}
                    </td>
                    <td className="text-center py-1.5 px-2 tabular-nums">
                      {game.rebounds ?? "-"}
                    </td>
                    <td className="text-center py-1.5 px-2 tabular-nums">
                      {game.assists ?? "-"}
                    </td>
                    <td className="text-center py-1.5 px-2 tabular-nums">
                      {game.fgm ?? 0}-{game.fga ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noStats")}</p>
        )}
      </Card>
    </div>
  );
}
