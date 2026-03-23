import { getTranslations, getLocale } from "next-intl/server";
import { db } from "@/db";
import { teams, posts, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { auth } from "@/lib/auth";
import { MessageCircle, Plus } from "lucide-react";

function timeAgo(date: Date, locale: string): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
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

async function getTeam(id: string) {
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, id))
    .limit(1);
  return team || null;
}

async function getTeamPosts(teamId: string) {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      likeCount: posts.likeCount,
      commentCount: posts.commentCount,
      createdAt: posts.createdAt,
      isPinned: posts.isPinned,
      authorDisplayName: users.displayName,
      authorUserNumber: users.userNumber,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.teamId, teamId), eq(posts.isDeleted, false)))
    .orderBy(desc(posts.createdAt));
}

export default async function TeamBoardPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("post");
  const tTeam = await getTranslations("team");
  const locale = await getLocale();
  const session = await auth();

  const team = await getTeam(id);
  if (!team) notFound();

  const teamPosts = await getTeamPosts(id);
  const teamName = locale === "zh-TW" ? team.nameZh : team.name;

  // Sort posts: pinned first, then by date (newest) or by likes (hot)
  const newestPosts = [...teamPosts].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const hotPosts = [...teamPosts].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.likeCount - a.likeCount;
  });

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Compact Team Header */}
      <div className="flex items-center gap-3">
        {team.logoUrl && (
          <img
            src={team.logoUrl}
            alt={team.abbreviation}
            className="w-10 h-10 object-contain"
          />
        )}
        <div>
          <h1
            style={{ fontSize: "var(--text-h2)" }}
            className="font-bold leading-tight"
          >
            {teamName}
          </h1>
          <p className="text-sm text-muted-foreground">{tTeam("board")}</p>
        </div>
      </div>

      {/* Create Post Button */}
      {session?.user && (
        <Link href={`/posts/new?teamId=${id}`}>
          <Button className="bg-gradient-to-r from-primary to-primary/80 hover:brightness-110">
            <Plus className="size-4 mr-1" />
            {t("createPost")}
          </Button>
        </Link>
      )}

      {/* Sort Tabs */}
      <Tabs defaultValue="hot">
        <TabsList>
          <TabsTrigger value="hot">{t("hot")}</TabsTrigger>
          <TabsTrigger value="new">{t("new")}</TabsTrigger>
        </TabsList>

        <TabsContent value="hot">
          {hotPosts.length > 0 ? (
            <PostList posts={hotPosts} locale={locale} />
          ) : (
            <EmptyState
              icon="chat"
              title={
                locale === "zh-TW"
                  ? "還沒有文章"
                  : "No posts yet"
              }
              description={
                locale === "zh-TW"
                  ? "成為第一個發文的人吧！"
                  : "Be the first to post!"
              }
            />
          )}
        </TabsContent>

        <TabsContent value="new">
          {newestPosts.length > 0 ? (
            <PostList posts={newestPosts} locale={locale} />
          ) : (
            <EmptyState
              icon="chat"
              title={
                locale === "zh-TW"
                  ? "還沒有文章"
                  : "No posts yet"
              }
              description={
                locale === "zh-TW"
                  ? "成為第一個發文的人吧！"
                  : "Be the first to post!"
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PostList({
  posts: postList,
  locale,
}: {
  posts: {
    id: string;
    title: string;
    likeCount: number;
    commentCount: number;
    createdAt: Date;
    isPinned: boolean;
    authorDisplayName: string;
    authorUserNumber: number;
  }[];
  locale: string;
}) {
  return (
    <div className="space-y-2 mt-4">
      {postList.map((post) => (
        <div
          key={post.id}
          className="rounded-lg border border-black/5 bg-card p-4 hover:bg-muted/30 transition-colors"
        >
          <Link href={`/posts/${post.id}`}>
            <div className="flex items-center gap-2 mb-2">
              {post.isPinned && (
                <span className="text-xs text-primary font-medium">
                  {locale === "zh-TW" ? "置頂" : "Pinned"}
                </span>
              )}
              <h3 className="font-medium">{post.title}</h3>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                {post.authorDisplayName}#
                {String(post.authorUserNumber).padStart(4, "0")}
              </span>
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
  );
}
