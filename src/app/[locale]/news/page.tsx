import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Newspaper, RefreshCw, Activity, BarChart3 } from "lucide-react";

export default async function NewsPage() {
  const t = await getTranslations("home");
  const locale = await getLocale();
  const isZh = locale === "zh-TW";

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1
        className="font-bold mb-8"
        style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontSize: "var(--font-h1)" }}
      >
        {t("latestNews")}
      </h1>

      {/* Coming soon card */}
      <div className="rounded-2xl border border-black/5 bg-card p-8 md:p-12 text-center animate-enter">
        <div className="mb-4 flex justify-center"><Newspaper className="w-12 h-12 text-muted-foreground" /></div>
        <h2 className="text-xl font-bold mb-2">
          {isZh ? "新聞聚合功能即將推出" : "News Aggregation Coming Soon"}
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {isZh
            ? "我們正在整合 NBA 新聞來源，包括交易、傷病報告、球隊動態等即時新聞。"
            : "We're integrating NBA news sources including trades, injury reports, and team updates."}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/posts"
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all"
          >
            {isZh ? "前往社群討論" : "Visit Community"}
          </Link>
          <Link
            href="/games"
            className="px-5 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors"
          >
            {isZh ? "查看賽事" : "View Games"}
          </Link>
        </div>
      </div>

      {/* Planned features */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3 animate-enter animate-enter-d2">
        {[
          { icon: <RefreshCw className="w-7 h-7 text-primary" />, title: isZh ? "即時交易" : "Live Trades", desc: isZh ? "球員交易和簽約即時更新" : "Real-time player trades & signings" },
          { icon: <Activity className="w-7 h-7 text-primary" />, title: isZh ? "傷病報告" : "Injury Reports", desc: isZh ? "每日傷病名單和復出時間表" : "Daily injury lists & return timelines" },
          { icon: <BarChart3 className="w-7 h-7 text-primary" />, title: isZh ? "深度分析" : "Analysis", desc: isZh ? "專業的戰術和數據分析文章" : "Expert tactical & statistical breakdowns" },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-black/5 bg-card p-5 card-hover">
            <div className="mb-2">{item.icon}</div>
            <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
