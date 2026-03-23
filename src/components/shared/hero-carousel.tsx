"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

interface GameSlide {
  id: string;
  awayTeam: { name: string; nameZh: string; abbreviation: string; logoUrl: string | null };
  homeTeam: { name: string; nameZh: string; abbreviation: string; logoUrl: string | null };
  awayScore: number;
  homeScore: number;
  status: string;
  startTime: string;
}

interface LeaderSlide {
  name: string;
  stat: number;
  unit: string;
  team: string;
}

interface HeroCarouselProps {
  featuredGame: GameSlide | null;
  topScorer: LeaderSlide;
  heroTitle: string;
  heroDescription: string;
}

const SLIDE_COUNT = 3;
const AUTO_INTERVAL = 5000;

export function HeroCarousel({ featuredGame, topScorer, heroTitle, heroDescription }: HeroCarouselProps) {
  const locale = useLocale();
  const isZh = locale === "zh-TW";
  const [active, setActive] = useState(0);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % SLIDE_COUNT);
  }, []);


  useEffect(() => {
    const timer = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(timer);
  }, [next, active]);

  const goTo = (index: number) => setActive(index);

  return (
    <section
      className="relative overflow-hidden rounded-2xl animate-enter"
      style={{
        background: "linear-gradient(135deg, #2D1B4E 0%, #4A1942 35%, #8B2E1A 70%, var(--color-primary) 100%)",
        minHeight: 280,
      }}
    >
      {/* Decorative shapes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
        <polygon points="850,0 1050,0 950,180" fill="#FF6B00" opacity="0.2" />
        <polygon points="950,400 1200,200 1200,400" fill="#FF6B00" opacity="0.15" />
        <polygon points="1000,0 1200,0 1200,150 1050,100" fill="#FF6B00" opacity="0.1" />
        <polygon points="700,350 800,200 900,400" fill="#FF6B00" opacity="0.12" />
        <polygon points="600,0 700,0 680,120 580,80" fill="#FF6B00" opacity="0.08" />
      </svg>

      {/* Slides container */}
      <div className="relative z-10" style={{ minHeight: 240 }}>
        {/* ===== Slide 0: Featured Game ===== */}
        <div
          className="absolute inset-0 p-6 md:p-10 transition-opacity duration-700 ease-in-out"
          style={{ opacity: active === 0 ? 1 : 0, pointerEvents: active === 0 ? "auto" : "none" }}
        >
          {featuredGame ? (
            <div className="flex items-start gap-6 md:gap-10 h-full">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-1">
                  {featuredGame.awayTeam.logoUrl && <img src={featuredGame.awayTeam.logoUrl} alt="" className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-lg hidden md:block" />}
                  <h2 className="text-white font-bold uppercase leading-[0.85]" style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontSize: "clamp(2.2rem, 6vw, 4.5rem)" }}>
                    {isZh ? featuredGame.awayTeam.nameZh : featuredGame.awayTeam.name}
                  </h2>
                </div>
                <span className="text-primary font-bold italic text-xl md:text-2xl ml-1 block mb-1" style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif" }}>vs</span>
                <div className="flex items-center gap-4">
                  {featuredGame.homeTeam.logoUrl && <img src={featuredGame.homeTeam.logoUrl} alt="" className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-lg hidden md:block" />}
                  <h2 className="text-white font-bold uppercase leading-[0.85]" style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontSize: "clamp(2.2rem, 6vw, 4.5rem)" }}>
                    {isZh ? featuredGame.homeTeam.nameZh : featuredGame.homeTeam.name}
                  </h2>
                </div>
                <p className="text-white/60 text-xs md:text-sm mt-3 uppercase tracking-wider">
                  {featuredGame.status === "final"
                    ? `Final · ${featuredGame.awayScore} - ${featuredGame.homeScore}`
                    : new Date(featuredGame.startTime).toLocaleString(isZh ? "zh-TW" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
                <Link href={`/games/${featuredGame.id}`} className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:brightness-110 transition-all">
                  {isZh ? "查看比賽數據" : "Watch Live Stats"} →
                </Link>
              </div>
              <div className="hidden lg:flex flex-col items-center gap-3 pr-4">
                {featuredGame.awayTeam.logoUrl && <img src={featuredGame.awayTeam.logoUrl} alt="" className="w-24 h-24 object-contain drop-shadow-2xl opacity-90" />}
                {featuredGame.homeTeam.logoUrl && <img src={featuredGame.homeTeam.logoUrl} alt="" className="w-24 h-24 object-contain drop-shadow-2xl opacity-90" />}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-white/60 text-sm uppercase tracking-widest mb-2">{isZh ? "精選比賽" : "Featured Game"}</h2>
              <p className="text-white/40 text-sm">{isZh ? "今日暫無賽事" : "No games scheduled today"}</p>
            </div>
          )}
        </div>

        {/* ===== Slide 1: Player Spotlight ===== */}
        <div
          className="absolute inset-0 p-6 md:p-10 transition-opacity duration-700 ease-in-out"
          style={{ opacity: active === 1 ? 1 : 0, pointerEvents: active === 1 ? "auto" : "none" }}
        >
          <p className="text-white/60 text-xs uppercase tracking-widest mb-3">{isZh ? "球員亮點" : "Player Spotlight"}</p>
          <h2 className="text-white font-bold uppercase leading-[0.85] mb-2" style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontSize: "clamp(2.5rem, 7vw, 5rem)" }}>
            {topScorer.name}
          </h2>
          <div className="flex items-end gap-3 mb-4">
            <span className="text-primary font-bold" style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontSize: "clamp(3rem, 8vw, 6rem)", lineHeight: 1 }}>
              {topScorer.stat}
            </span>
            <span className="text-white/50 text-lg md:text-xl font-semibold uppercase mb-2">{topScorer.unit}</span>
          </div>
          <p className="text-white/50 text-sm mb-4">{topScorer.team} · {isZh ? "聯盟得分王" : "League Scoring Leader"}</p>
          <Link href="/posts" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 text-white text-sm font-semibold border border-white/25 hover:bg-white/25 transition-colors">
            {isZh ? "查看排行榜" : "View Leaderboard"} →
          </Link>
        </div>

        {/* ===== Slide 2: Platform Intro ===== */}
        <div
          className="absolute inset-0 p-6 md:p-10 transition-opacity duration-700 ease-in-out"
          style={{ opacity: active === 2 ? 1 : 0, pointerEvents: active === 2 ? "auto" : "none" }}
        >
          <h2 className="text-white font-bold uppercase tracking-wide leading-[0.85] mb-4" style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontSize: "clamp(2.5rem, 7vw, 5rem)" }}>
            {heroTitle}
          </h2>
          <p className="text-white/70 mb-6 max-w-lg" style={{ fontSize: "var(--font-body)" }}>{heroDescription}</p>
          <div className="flex gap-3">
            <Link href="/teams" className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:brightness-110 transition-all">
              {isZh ? "探索球隊" : "Explore Teams"} →
            </Link>
            <Link href="/posts" className="px-5 py-2.5 rounded-full bg-white/15 text-white text-sm font-semibold border border-white/25 hover:bg-white/25 transition-colors">
              {isZh ? "加入討論" : "Join Discussion"}
            </Link>
          </div>
        </div>
      </div>

      {/* Carousel indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              active === i ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
