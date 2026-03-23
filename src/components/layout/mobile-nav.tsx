"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Home, Trophy, Users, MessageSquare, Newspaper } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, labelKey: "home" },
  { href: "/games", icon: Trophy, labelKey: "games" },
  { href: "/teams", icon: Users, labelKey: "teams" },
  { href: "/posts", icon: MessageSquare, labelKey: "community" },
  { href: "/news", icon: Newspaper, labelKey: "news" },
] as const;

export function MobileNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/90 backdrop-blur-xl border-t border-black/5 h-14">
      <div className="flex items-center justify-around h-full">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="size-5" />
              <span className="text-[10px]">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
