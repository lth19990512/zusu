"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import useSWR, { mutate } from "swr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Star, X, Plus, User, FileText } from "lucide-react";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  });

function timeAgo(date: string, locale: string): string {
  const d = new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return locale === "zh-TW" ? "剛剛" : "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return locale === "zh-TW" ? `${minutes} 分鐘前` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return locale === "zh-TW" ? `${hours} 小時前` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale === "zh-TW" ? `${days} 天前` : `${days}d ago`;
}

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  userNumber: number;
  locale: string;
  createdAt: string;
}

interface FavoriteTeam {
  teamId: string;
  isPrimary: boolean;
  team: {
    id: string;
    name: string;
    nameZh: string;
    abbreviation: string;
    logoUrl: string | null;
  };
}

interface UserPost {
  id: string;
  title: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const locale = useLocale();

  const {
    data: user,
    error: userError,
    isLoading: userLoading,
  } = useSWR<UserProfile>("/api/users/me", fetcher);

  const {
    data: favorites,
    error: favError,
    isLoading: favLoading,
  } = useSWR<FavoriteTeam[]>("/api/users/me/favorites", fetcher);

  const {
    data: userPosts,
    error: postsError,
    isLoading: postsLoading,
  } = useSWR<UserPost[]>("/api/users/me/posts", fetcher);

  const [showTeamSelect, setShowTeamSelect] = useState(false);

  // Check if user is not authenticated (401)
  const isUnauth =
    userError?.message === "401" ||
    favError?.message === "401" ||
    postsError?.message === "401";

  if (isUnauth) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-8 text-center">
          <User className="size-16 text-muted-foreground/20 mx-auto mb-4" />
          <h2 className="text-lg font-medium mb-2">
            {locale === "zh-TW" ? "請先登入" : "Please log in"}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {locale === "zh-TW"
              ? "需要登入才能查看個人檔案"
              : "You need to log in to view your profile"}
          </p>
          <Link href="/login">
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:brightness-110">
              {tAuth("loginTitle")}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  async function handleSetPrimary(teamId: string) {
    try {
      await fetch(`/api/users/me/favorites/${teamId}/primary`, {
        method: "PUT",
      });
      mutate("/api/users/me/favorites");
    } catch {
      // Silently fail
    }
  }

  async function handleRemoveFavorite(teamId: string) {
    try {
      await fetch(`/api/users/me/favorites/${teamId}`, {
        method: "DELETE",
      });
      mutate("/api/users/me/favorites");
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
      {/* User Info */}
      <div>
        <h1
          style={{ fontSize: "var(--text-h1)" }}
          className="font-bold mb-6"
        >
          {t("myProfile")}
        </h1>

        <Card className="p-6">
          {userLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : user ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {user.displayName}#
                  {String(user.userNumber).padStart(4, "0")}
                </h2>
                <button
                  onClick={() => {
                    const newName = prompt(
                      locale === "zh-TW" ? "輸入新暱稱 (2-20字)" : "Enter new display name (2-20 chars)",
                      user.displayName
                    );
                    if (newName && newName !== user.displayName) {
                      fetch("/api/users/me", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ displayName: newName }),
                      }).then((res) => {
                        if (res.ok) mutate("/api/users/me");
                        else res.json().then((d) => alert(d.error || "Error"));
                      });
                    }
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  {locale === "zh-TW" ? "編輯暱稱" : "Edit Name"}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {tAuth("email")}: {user.email}
              </p>
              <p className="text-sm text-muted-foreground">
                {locale === "zh-TW" ? "加入時間" : "Joined"}:{" "}
                {new Date(user.createdAt).toLocaleDateString(
                  locale === "zh-TW" ? "zh-TW" : "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {locale === "zh-TW" ? "語言" : "Locale"}: {user.locale}
              </p>
            </div>
          ) : userError ? (
            <p className="text-sm text-destructive">{tCommon("error")}</p>
          ) : null}
        </Card>
      </div>

      <Separator />

      {/* Favorite Teams */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t("favoriteTeams")}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTeamSelect(!showTeamSelect)}
          >
            <Plus className="size-4 mr-1" />
            {locale === "zh-TW" ? "新增" : "Add"}
          </Button>
        </div>

        {showTeamSelect && <AddTeamSection onAdded={() => setShowTeamSelect(false)} />}

        {favLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="space-y-2">
            {favorites.map((fav) => {
              const teamName =
                locale === "zh-TW" ? fav.team.nameZh : fav.team.name;
              return (
                <Card
                  key={fav.teamId}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {fav.team.logoUrl && (
                      <img
                        src={fav.team.logoUrl}
                        alt={fav.team.abbreviation}
                        className="w-8 h-8 object-contain"
                      />
                    )}
                    <div>
                      <span className="font-medium">{teamName}</span>
                      {fav.isPrimary && (
                        <Star className="size-4 text-yellow-500 fill-yellow-500 inline ml-2" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!fav.isPrimary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetPrimary(fav.teamId)}
                        title={t("setPrimary")}
                      >
                        <Star className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFavorite(fav.teamId)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="basketball"
            title={
              locale === "zh-TW"
                ? "還沒有設定主隊"
                : "No favorite teams yet"
            }
            description={t("selectTeam")}
          />
        )}
      </div>

      <Separator />

      {/* My Posts */}
      <div>
        <h2 className="text-lg font-bold mb-4">{t("myPosts")}</h2>

        {postsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : userPosts && userPosts.length > 0 ? (
          <div className="space-y-2">
            {userPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-lg border border-black/5 bg-card p-4 hover:bg-muted/30 transition-colors"
              >
                <Link href={`/posts/${post.id}`}>
                  <h3 className="font-medium mb-2">{post.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      {post.likeCount}{" "}
                      {locale === "zh-TW" ? "讚" : "likes"}
                    </span>
                    <span>
                      {post.commentCount}{" "}
                      {locale === "zh-TW" ? "留言" : "comments"}
                    </span>
                    <span>{timeAgo(post.createdAt, locale)}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="chat"
            title={
              locale === "zh-TW"
                ? "還沒有發表文章"
                : "No posts yet"
            }
          />
        )}
      </div>
    </div>
  );
}

function AddTeamSection({ onAdded }: { onAdded: () => void }) {
  const locale = useLocale();
  const { data: allTeams } = useSWR<
    { id: string; name: string; nameZh: string; abbreviation: string }[]
  >("/api/teams", fetcher);

  const [selectedTeamId, setSelectedTeamId] = useState("");

  async function handleAdd() {
    if (!selectedTeamId) return;
    try {
      await fetch("/api/users/me/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeamId }),
      });
      mutate("/api/users/me/favorites");
      onAdded();
    } catch {
      // Silently fail
    }
  }

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center gap-2">
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className="flex-1 rounded-md border border-black/10 bg-background px-3 py-2 text-sm"
        >
          <option value="">
            {locale === "zh-TW" ? "選擇球隊..." : "Select a team..."}
          </option>
          {allTeams?.map((team) => (
            <option key={team.id} value={team.id}>
              {locale === "zh-TW" ? team.nameZh : team.name}
            </option>
          ))}
        </select>
        <Button
          onClick={handleAdd}
          disabled={!selectedTeamId}
          className="bg-gradient-to-r from-primary to-primary/80 hover:brightness-110"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
