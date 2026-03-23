"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLocale } from "next-intl";
import { useState, useRef } from "react";
import { Menu, Search, Globe, User } from "lucide-react";
import { SearchDialog } from "@/components/shared/search-dialog";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "games", href: "/games" },
  { key: "news", href: "/news" },
  { key: "teams", href: "/teams" },
  { key: "community", href: "/posts" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isZh = locale === "zh-TW";

  const switchLocale = (newLocale: "zh-TW" | "en") => {
    router.replace(pathname, { locale: newLocale });
  };

  const handleSearchSubmit = () => {
    setSearchOpen(true);
    // Focus will be handled by SearchDialog
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-xl border-b border-black/8">
      <div className="container mx-auto flex h-16 items-center px-4 gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="Zusu" className="h-8 w-8 object-contain" />
          <span
            className="text-2xl font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif" }}
          >
            Zusu
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "relative text-sm font-semibold uppercase tracking-wider transition-colors py-1 link-underline",
                  isActive
                    ? "text-foreground after:!w-full after:!left-0"
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        {/* Right side — Search + Actions */}
        <div className="ml-auto flex items-center gap-3">
          {/* Search input (desktop) */}
          <div className="hidden md:flex items-center">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={isZh ? "搜尋..." : "Search"}
              className="w-36 lg:w-44 h-9 rounded-l-full border border-black/10 border-r-0 bg-background px-4 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-colors"
              readOnly
              onClick={handleSearchSubmit}
            />
            <button
              onClick={handleSearchSubmit}
              className="h-9 w-10 rounded-r-full bg-primary flex items-center justify-center hover:brightness-110 transition-all"
            >
              <Search className="size-4 text-white" />
            </button>
          </div>
          <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

          {/* Mobile search icon */}
          <button onClick={() => setSearchOpen(true)} className="md:hidden text-foreground/70">
            <Search className="size-5" />
          </button>

          {/* User menu (desktop) */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="hidden md:flex items-center justify-center w-9 h-9 rounded-full border border-black/10 hover:bg-muted transition-colors cursor-pointer">
                <User className="size-4 text-foreground/70" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Link href="/login" className="w-full">{t("login")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/register" className="w-full">{t("register")}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => switchLocale(locale === "zh-TW" ? "en" : "zh-TW")}>
                <Globe className="size-4 mr-2" />
                {locale === "zh-TW" ? "English" : "繁體中文"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger>
              <div className="md:hidden text-foreground/70 cursor-pointer">
                <Menu className="size-6" />
              </div>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="text-lg font-semibold uppercase tracking-wider" onClick={() => setMobileOpen(false)}>
                  {t("home")}
                </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="text-lg font-semibold uppercase tracking-wider"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t(item.key)}
                  </Link>
                ))}
                <div className="border-t border-black/5 pt-4 flex flex-col gap-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">{t("login")}</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full">{t("register")}</Button>
                  </Link>
                  <Button variant="ghost" onClick={() => { switchLocale(locale === "zh-TW" ? "en" : "zh-TW"); setMobileOpen(false); }} className="w-full justify-start">
                    <Globe className="size-4 mr-2" />
                    {locale === "zh-TW" ? "English" : "繁體中文"}
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
