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

// Mock data for when no real data exists
// NBA CDN headshot URL helper
const nbaPhoto = (playerId: string) => `https://cdn.nba.com/headshots/nba/latest/260x190/${playerId}.png`;

const MOCK_LEADERS: Record<string, LeaderEntry[]> = {
  ppg: [
    { id: "mock-1", firstName: "Jayson", lastName: "Tatum", position: "SF", photoUrl: nbaPhoto("1628369"), jerseyNumber: "0", teamAbbreviation: "BOS", teamLogoUrl: null, teamPrimaryColor: "#007A33", avg: 31.1, gamesPlayed: 45 },
    { id: "mock-2", firstName: "Stephen", lastName: "Curry", position: "PG", photoUrl: nbaPhoto("201939"), jerseyNumber: "30", teamAbbreviation: "GSW", teamLogoUrl: null, teamPrimaryColor: "#1D428A", avg: 30.2, gamesPlayed: 43 },
    { id: "mock-3", firstName: "Devin", lastName: "Booker", position: "SG", photoUrl: nbaPhoto("1626164"), jerseyNumber: "1", teamAbbreviation: "PHX", teamLogoUrl: null, teamPrimaryColor: "#1D1160", avg: 28.9, gamesPlayed: 44 },
    { id: "mock-4", firstName: "Luka", lastName: "Dončić", position: "PG", photoUrl: nbaPhoto("1629029"), jerseyNumber: "77", teamAbbreviation: "DAL", teamLogoUrl: null, teamPrimaryColor: "#00538C", avg: 28.4, gamesPlayed: 42 },
    { id: "mock-5", firstName: "Giannis", lastName: "Antetokounmpo", position: "PF", photoUrl: nbaPhoto("203507"), jerseyNumber: "34", teamAbbreviation: "MIL", teamLogoUrl: null, teamPrimaryColor: "#00471B", avg: 28.1, gamesPlayed: 43 },
  ],
  rpg: [
    { id: "mock-r1", firstName: "Domantas", lastName: "Sabonis", position: "C", photoUrl: nbaPhoto("1627734"), jerseyNumber: "10", teamAbbreviation: "SAC", teamLogoUrl: null, teamPrimaryColor: "#5A2D81", avg: 14.2, gamesPlayed: 44 },
    { id: "mock-r2", firstName: "Nikola", lastName: "Jokić", position: "C", photoUrl: nbaPhoto("203999"), jerseyNumber: "15", teamAbbreviation: "DEN", teamLogoUrl: null, teamPrimaryColor: "#0E2240", avg: 13.1, gamesPlayed: 43 },
    { id: "mock-r3", firstName: "Anthony", lastName: "Davis", position: "PF", photoUrl: nbaPhoto("203076"), jerseyNumber: "3", teamAbbreviation: "LAL", teamLogoUrl: null, teamPrimaryColor: "#552583", avg: 12.3, gamesPlayed: 40 },
    { id: "mock-r4", firstName: "Rudy", lastName: "Gobert", position: "C", photoUrl: nbaPhoto("203497"), jerseyNumber: "27", teamAbbreviation: "MIN", teamLogoUrl: null, teamPrimaryColor: "#0C2340", avg: 11.8, gamesPlayed: 42 },
    { id: "mock-r5", firstName: "Karl-Anthony", lastName: "Towns", position: "C", photoUrl: nbaPhoto("1626157"), jerseyNumber: "32", teamAbbreviation: "NYK", teamLogoUrl: null, teamPrimaryColor: "#006BB6", avg: 11.5, gamesPlayed: 41 },
  ],
  apg: [
    { id: "mock-a1", firstName: "Tyrese", lastName: "Haliburton", position: "PG", photoUrl: nbaPhoto("1630169"), jerseyNumber: "0", teamAbbreviation: "IND", teamLogoUrl: null, teamPrimaryColor: "#002D62", avg: 10.8, gamesPlayed: 42 },
    { id: "mock-a2", firstName: "Trae", lastName: "Young", position: "PG", photoUrl: nbaPhoto("1629027"), jerseyNumber: "11", teamAbbreviation: "ATL", teamLogoUrl: null, teamPrimaryColor: "#E03A3E", avg: 10.5, gamesPlayed: 44 },
    { id: "mock-a3", firstName: "Luka", lastName: "Dončić", position: "PG", photoUrl: nbaPhoto("1629029"), jerseyNumber: "77", teamAbbreviation: "DAL", teamLogoUrl: null, teamPrimaryColor: "#00538C", avg: 9.8, gamesPlayed: 42 },
    { id: "mock-a4", firstName: "LaMelo", lastName: "Ball", position: "PG", photoUrl: nbaPhoto("1630163"), jerseyNumber: "1", teamAbbreviation: "CHA", teamLogoUrl: null, teamPrimaryColor: "#1D1160", avg: 8.9, gamesPlayed: 38 },
    { id: "mock-a5", firstName: "Jalen", lastName: "Brunson", position: "PG", photoUrl: nbaPhoto("1628973"), jerseyNumber: "11", teamAbbreviation: "NYK", teamLogoUrl: null, teamPrimaryColor: "#006BB6", avg: 8.7, gamesPlayed: 43 },
  ],
};

export function PlayerLeaderboard() {
  const locale = useLocale();
  const isZh = locale === "zh-TW";
  const [activeCategory, setActiveCategory] = useState("ppg");
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/players/leaders?category=${activeCategory}&limit=5`)
      .then((r) => r.json())
      .then((data) => {
        if (data.leaders && data.leaders.length > 0) {
          setLeaders(data.leaders);
          setIsMock(false);
        } else {
          // Fallback to mock data
          setLeaders(MOCK_LEADERS[activeCategory] || MOCK_LEADERS.ppg);
          setIsMock(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setLeaders(MOCK_LEADERS[activeCategory] || MOCK_LEADERS.ppg);
        setIsMock(true);
        setLoading(false);
      });
  }, [activeCategory]);

  return (
    <div>
      {/* Section title */}
      <h2
        className="font-bold uppercase tracking-wide mb-4"
        style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontSize: "var(--font-h2)" }}
      >
        {isZh ? "球員排行榜" : "Player Leaderboard"}
        {isMock && <span className="text-xs text-muted-foreground font-normal ml-2">({isZh ? "示範數據" : "Demo"})</span>}
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
        ) : leaders.length > 0 ? (
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
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            {isZh ? "暫無排行數據" : "No ranking data available"}
          </p>
        )}
      </div>
    </div>
  );
}
