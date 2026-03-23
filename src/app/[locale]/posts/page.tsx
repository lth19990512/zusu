import { getTranslations, getLocale } from "next-intl/server";
import { db } from "@/db";
import { posts, users, teams } from "@/db/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { PostCard } from "@/components/posts/post-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Link } from "@/i18n/navigation";

async function getPosts(sort: string, teamId?: string, limit = 20) {
  const conditions = [eq(posts.isDeleted, false)];
  if (teamId) conditions.push(eq(posts.teamId, teamId));

  const orderBy =
    sort === "hot"
      ? [desc(sql`(${posts.likeCount} * 2 + ${posts.commentCount} * 3)`), desc(posts.createdAt)]
      : [desc(posts.createdAt)];

  return db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      type: posts.type,
      likeCount: posts.likeCount,
      commentCount: posts.commentCount,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      isPinned: posts.isPinned,
      author: {
        displayName: users.displayName,
        userNumber: users.userNumber,
      },
      team: {
        abbreviation: teams.abbreviation,
        logoUrl: teams.logoUrl,
        name: teams.name,
        nameZh: teams.nameZh,
      },
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .leftJoin(teams, eq(posts.teamId, teams.id))
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(limit);
}

async function getTeamsForFilter() {
  return db
    .select({
      id: teams.id,
      name: teams.name,
      nameZh: teams.nameZh,
      abbreviation: teams.abbreviation,
      logoUrl: teams.logoUrl,
    })
    .from(teams)
    .orderBy(teams.abbreviation);
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; team?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("post");
  const locale = await getLocale();
  const isZh = locale === "zh-TW";

  const sort = params.sort || "hot";
  const teamFilter = params.team;

  const [postList, allTeams] = await Promise.all([
    getPosts(sort, teamFilter),
    getTeamsForFilter(),
  ]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontSize: "var(--text-h1)" }} className="font-bold">
          {isZh ? "社群討論" : "Community"}
        </h1>
        <Link
          href="/posts/new"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all"
        >
          {isZh ? "✏️ 發文" : "✏️ New Post"}
        </Link>
      </div>

      {/* Sort tabs + team filter */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="inline-flex rounded-lg border border-black/10 overflow-hidden text-sm">
          <a
            href={`?sort=hot${teamFilter ? `&team=${teamFilter}` : ""}`}
            className={`px-4 py-2 transition-colors ${
              sort === "hot"
                ? "bg-primary/20 text-primary font-medium"
                : "text-muted-foreground hover:bg-black/5"
            }`}
          >
            🔥 {isZh ? "熱門" : "Hot"}
          </a>
          <a
            href={`?sort=new${teamFilter ? `&team=${teamFilter}` : ""}`}
            className={`px-4 py-2 transition-colors ${
              sort === "new"
                ? "bg-primary/20 text-primary font-medium"
                : "text-muted-foreground hover:bg-black/5"
            }`}
          >
            🕐 {isZh ? "最新" : "New"}
          </a>
        </div>

        {/* Team filter chips */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          <a
            href={`?sort=${sort}`}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors border ${
              !teamFilter
                ? "bg-primary text-primary-foreground border-primary"
                : "border-black/5 text-muted-foreground hover:bg-black/5"
            }`}
          >
            {isZh ? "全部" : "All"}
          </a>
          {allTeams.map((team) => (
            <a
              key={team.id}
              href={`?sort=${sort}&team=${team.id}`}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors border flex items-center gap-1 ${
                teamFilter === team.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-black/5 text-muted-foreground hover:bg-black/5"
              }`}
            >
              {team.logoUrl && <img src={team.logoUrl} alt="" className="w-3.5 h-3.5 object-contain" />}
              {team.abbreviation}
            </a>
          ))}
        </div>
      </div>

      {/* Post list */}
      {postList.length > 0 ? (
        <div className="space-y-3">
          {postList.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              content={post.content}
              type={post.type}
              author={post.author}
              team={post.team?.abbreviation ? post.team : null}
              likeCount={post.likeCount}
              commentCount={post.commentCount}
              viewCount={post.viewCount}
              createdAt={post.createdAt.toISOString()}
              isPinned={post.isPinned}
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="chat"
          title={isZh ? "還沒有貼文" : "No posts yet"}
          description={isZh ? "成為第一個發文的人！" : "Be the first to post!"}
        />
      )}
    </div>
  );
}
