"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function BasketballIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2c2.5 4 2.5 16 0 20" />
      <path d="M12 2c-2.5 4-2.5 16 0 20" />
    </svg>
  );
}

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  return (
    <footer className="border-t border-black/5 bg-muted mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Zusu" className="h-6 w-6 object-contain" />
              <span className="text-lg font-bold">Zusu</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("description")}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t("quickLinks")}</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                {nav("home")}
              </Link>
              <Link href="/games" className="hover:text-foreground transition-colors">
                {nav("games")}
              </Link>
              <Link href="/teams" className="hover:text-foreground transition-colors">
                {nav("teams")}
              </Link>
              <Link href="/posts" className="hover:text-foreground transition-colors">
                {nav("community")}
              </Link>
            </nav>
          </div>

          {/* Column 3: Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t("info")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("disclaimer")}
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 pt-6 border-t border-black/5 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Zusu. {t("rights")}
        </div>
      </div>
    </footer>
  );
}
