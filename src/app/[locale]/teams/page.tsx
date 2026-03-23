import { getTranslations, getLocale } from "next-intl/server";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";

async function getAllTeams() {
  return db
    .select()
    .from(teams)
    .orderBy(teams.conference, teams.division, teams.name);
}

export default async function TeamsPage() {
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const allTeams = await getAllTeams();

  // Group by conference -> division
  const grouped: Record<string, Record<string, typeof allTeams>> = {};
  for (const team of allTeams) {
    if (!grouped[team.conference]) grouped[team.conference] = {};
    if (!grouped[team.conference][team.division])
      grouped[team.conference][team.division] = [];
    grouped[team.conference][team.division].push(team);
  }

  const conferenceLabels: Record<string, string> = {
    East: locale === "zh-TW" ? "東區" : "Eastern Conference",
    West: locale === "zh-TW" ? "西區" : "Western Conference",
  };

  const divisionLabels: Record<string, string> = locale === "zh-TW"
    ? { Atlantic: "大西洋組", Central: "中央組", Southeast: "東南組", Northwest: "西北組", Pacific: "太平洋組", Southwest: "西南組" }
    : { Atlantic: "Atlantic", Central: "Central", Southeast: "Southeast", Northwest: "Northwest", Pacific: "Pacific", Southwest: "Southwest" };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 style={{ fontSize: "var(--text-h1)" }} className="font-bold mb-6">{t("teams")}</h1>

      {allTeams.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          {locale === "zh-TW"
            ? "球隊資料尚未同步，請稍後再試"
            : "Team data not yet synced. Please try again later."}
        </div>
      ) : (
        Object.entries(grouped).map(([conference, divisions]) => (
          <div key={conference} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {conferenceLabels[conference] || conference}
            </h2>
            <div className="space-y-4">
              {Object.entries(divisions).map(([division, divTeams]) => (
                <div key={division}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    {divisionLabels[division] || division}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {divTeams.map((team) => (
                      <Link key={team.id} href={`/teams/${team.id}`}>
                        <Card className="p-3 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-3 group card-hover border-t-[3px]" style={{ borderTopColor: team.primaryColor ?? "transparent" }}>
                          {team.logoUrl && (
                            <img
                              src={team.logoUrl}
                              alt={team.abbreviation}
                              className="w-8 h-8 object-contain"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {locale === "zh-TW" ? team.nameZh : team.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {team.abbreviation}
                            </p>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
