"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, User, Users, MessageSquare } from "lucide-react";

interface SearchResults {
  players: { id: string; firstName: string; lastName: string; position: string | null; photoUrl: string | null }[];
  teams: { id: string; name: string; nameZh: string; abbreviation: string; logoUrl: string | null }[];
  posts: { id: string; title: string; authorName: string }[];
}

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const isZh = locale === "zh-TW";

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (!open) { setQuery(""); setResults(null); }
  }, [open]);

  const navigate = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const hasResults = results && (results.players.length > 0 || results.teams.length > 0 || results.posts.length > 0);
  const noResults = results && !hasResults && query.length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-black/5">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isZh ? "搜尋球員、球隊、貼文..." : "Search players, teams, posts..."}
            className="border-0 focus-visible:ring-0 px-0 h-12 text-base"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-6">
              {isZh ? "搜尋中..." : "Searching..."}
            </p>
          )}

          {noResults && !loading && (
            <p className="text-sm text-muted-foreground text-center py-6">
              {isZh ? "找不到結果" : "No results found"}
            </p>
          )}

          {hasResults && (
            <div className="space-y-1">
              {/* Players */}
              {results.players.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground px-2 pt-2">
                    {isZh ? "球員" : "Players"}
                  </p>
                  {results.players.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/players/${p.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-left transition-colors"
                    >
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover bg-muted" />
                      ) : (
                        <User className="w-8 h-8 p-1.5 rounded-full bg-muted text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                        {p.position && <p className="text-xs text-muted-foreground">{p.position}</p>}
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Teams */}
              {results.teams.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground px-2 pt-2">
                    {isZh ? "球隊" : "Teams"}
                  </p>
                  {results.teams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => navigate(`/teams/${t.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-left transition-colors"
                    >
                      {t.logoUrl ? (
                        <img src={t.logoUrl} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <Users className="w-8 h-8 p-1.5 rounded-full bg-muted text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{isZh ? t.nameZh : t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.abbreviation}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Posts */}
              {results.posts.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground px-2 pt-2">
                    {isZh ? "貼文" : "Posts"}
                  </p>
                  {results.posts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/posts/${p.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-left transition-colors"
                    >
                      <MessageSquare className="w-8 h-8 p-1.5 rounded-full bg-muted text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.authorName}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {!results && !loading && query.length < 2 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              {isZh ? "輸入至少 2 個字元開始搜尋" : "Type at least 2 characters to search"}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
