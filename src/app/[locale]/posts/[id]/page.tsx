import { getTranslations, getLocale } from "next-intl/server";
import { db } from "@/db";
import { posts, users, comments, likes, teams } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { PostInteractions } from "@/components/posts/post-interactions";
import { ArrowLeft } from "lucide-react";

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

async function getPost(id: string) {
  const [post] = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      likeCount: posts.likeCount,
      commentCount: posts.commentCount,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      teamId: posts.teamId,
      authorId: posts.authorId,
      isDeleted: posts.isDeleted,
      authorDisplayName: users.displayName,
      authorUserNumber: users.userNumber,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, id))
    .limit(1);
  return post || null;
}

async function getPostComments(postId: string) {
  return db
    .select({
      id: comments.id,
      content: comments.content,
      parentId: comments.parentId,
      createdAt: comments.createdAt,
      likeCount: comments.likeCount,
      authorDisplayName: users.displayName,
      authorUserNumber: users.userNumber,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(and(eq(comments.postId, postId), eq(comments.isDeleted, false)))
    .orderBy(asc(comments.createdAt));
}

async function getTeamInfo(teamId: string) {
  const [team] = await db
    .select({
      id: teams.id,
      name: teams.name,
      nameZh: teams.nameZh,
      abbreviation: teams.abbreviation,
    })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);
  return team || null;
}

async function checkUserLiked(userId: string, postId: string) {
  const [like] = await db
    .select()
    .from(likes)
    .where(
      and(
        eq(likes.userId, userId),
        eq(likes.targetType, "post"),
        eq(likes.targetId, postId)
      )
    )
    .limit(1);
  return !!like;
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const tCommon = await getTranslations("common");
  const locale = await getLocale();
  const session = await auth();

  const post = await getPost(id);
  if (!post || post.isDeleted) notFound();

  const [postComments, team, userLiked] = await Promise.all([
    getPostComments(id),
    post.teamId ? getTeamInfo(post.teamId) : Promise.resolve(null),
    session?.user?.id
      ? checkUserLiked(session.user.id, id)
      : Promise.resolve(false),
  ]);

  const teamName = team
    ? locale === "zh-TW"
      ? team.nameZh
      : team.name
    : null;

  // Serialize comments for client component
  const serializedComments = postComments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Back Button */}
      <Link
        href={post.teamId ? `/teams/${post.teamId}/board` : "/"}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-4" />
        {tCommon("back")}
      </Link>

      {/* Post Header */}
      <h1
        style={{ fontSize: "var(--text-h1)" }}
        className="font-bold mb-4"
      >
        {post.title}
      </h1>

      {/* Metadata */}
      <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground mb-6">
        <span className="font-medium text-foreground">
          {post.authorDisplayName}#
          {String(post.authorUserNumber).padStart(4, "0")}
        </span>
        <span>{timeAgo(post.createdAt, locale)}</span>
        {team && (
          <Link href={`/teams/${team.id}/board`}>
            <Badge variant="secondary">{teamName}</Badge>
          </Link>
        )}
      </div>

      {/* Post Content */}
      <div className="rounded-lg border border-black/5 bg-card p-6 mb-8">
        <p className="whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>

      {/* Interactive Section */}
      <PostInteractions
        postId={id}
        initialLiked={userLiked}
        initialLikeCount={post.likeCount}
        comments={serializedComments}
        locale={locale}
      />
    </div>
  );
}
