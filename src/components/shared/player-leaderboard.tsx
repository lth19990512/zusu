"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

interface LeaderEntry {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  photoUrl: string | null;
  jerseyNumber: string | null;
  teamAbbreviation: string;
  teamLogoUrl: string | null;
  teamPrimaryColor: string | null;
  avg: number;
  gamesPlayed: number;
}

const CATEGORIES = [
  { key: "ppg", labelEn: "POINTS", labelZh: "得分" },
  { key: "rpg", labelEn: "REBOUNDS", labelZh: "籃板" },
  { key: "apg", labelEn: "ASSISTS", labelZh: "助攻" },
  { key: "spg", labelEn: "STEALS", labelZh: "抄截" },
  { key: "bpg", labelEn: "BLOCKS", labelZh: "阻攻" },
] as const;

const CATEGORY_UNIT: Record<string, string> = {
  ppg: "PPG", rpg: "RPG", apg: "APG", spg: "SPG", bpg: "BPG",
};

export function PlayerLeaderboard() {
  const locale = useLocale();
  const isZh = locale === "zh-TW";
  const [activeCategory, setActiveCategory] = useState("ppg");
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/players/leaders?category=${activeCategory}&limit=5`)
      .then((r) => r.json())
      .then((data) => {
        if (data.leaders && data.leaders.length > 0) {
          setLeaders(data.leaders);
          setHasData(true);
        } else {
          setLeaders([]);
          setHasData(false);
        }
        setLoading(false);
      })
      .catch(() => {
        setLeaders([]);
        setHasData(false);
        setLoading(false);
      });
  }, [activeCategory]);

  // Don't render anything if there's no real data and we're not loading
  if (!loading && !hasData) {
    return null;
  }

  return (
    <section className="rounded-2xl bg-card border border-black/5 p-5">
      <div>
        {/* Section title */}
        <h2
          className="font-bold uppercase tracking-wide mb-4"
          style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontSize: "var(--font-h2)" }}
        >
          {isZh ? "球員排行榜" : "Player Leaderboard"}
        </h2>

        {/* Category tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                activeCategory === cat.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {isZh ? cat.labelZh : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Leaders list */}
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card animate-pulse">
                <div className="w-6 h-6 rounded-full bg-muted" />
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
                <div className="h-6 w-12 bg-muted rounded" />
              </div>
            ))
          ) : (
            leaders.map((player, i) => (
              <Link key={player.id} href={`/players/${player.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card card-hover">
                  {/* Rank */}
                  <span
                    className={`w-6 text-center font-bold ${
                      i === 0 ? "text-primary text-lg" : "text-muted-foreground text-sm"
                    }`}
                    style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif" }}
                  >
                    {i + 1}
                  </span>

                  {/* Photo */}
                  {player.photoUrl ? (
                    <img
                      src={player.photoUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover bg-muted"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {player.firstName[0]}{player.lastName[0]}
                    </div>
                  )}

                  {/* Name + team */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {player.firstName.charAt(0)}. {player.lastName}
                    </p>
                    <div className="flex items-center gap-1">
                      {player.teamLogoUrl && (
                        <img src={player.teamLogoUrl} alt="" className="w-3.5 h-3.5 object-contain" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {player.teamAbbreviation}
                      </span>
                    </div>
                  </div>

                  {/* Stat value */}
                  <div className="text-right">
                    <span
                      className="text-lg font-bold"
                      style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif" }}
                    >
                      {player.avg}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1 uppercase">
                      {CATEGORY_UNIT[activeCategory]}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
