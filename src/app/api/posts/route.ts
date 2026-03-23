import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts, users, teams } from "@/db/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { createPostSchema } from "@/lib/validations/post";
import { postRateLimit } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const teamId = searchParams.get("teamId");
  const gameId = searchParams.get("gameId");
  const type = searchParams.get("type") as
    | "discussion"
    | "game_thread"
    | null;
  const sort = searchParams.get("sort") || "new";
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  const conditions = [eq(posts.isDeleted, false)];
  if (teamId) conditions.push(eq(posts.teamId, teamId));
  if (gameId) conditions.push(eq(posts.gameId, gameId));
  if (type) conditions.push(eq(posts.type, type));

  const where = and(...conditions);

  const orderBy =
    sort === "hot"
      ? [
          desc(
            sql`(${posts.likeCount} * 2 + ${posts.commentCount} * 3)`
          ),
          desc(posts.createdAt),
        ]
      : [desc(posts.createdAt)];

  const [postList, totalResult] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        type: posts.type,
        locale: posts.locale,
        isPinned: posts.isPinned,
        isLocked: posts.isLocked,
        viewCount: posts.viewCount,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        teamId: posts.teamId,
        gameId: posts.gameId,
        author: {
          id: users.id,
          displayName: users.displayName,
          userNumber: users.userNumber,
          avatarUrl: users.avatarUrl,
        },
        team: {
          id: teams.id,
          name: teams.name,
          nameZh: teams.nameZh,
          abbreviation: teams.abbreviation,
          logoUrl: teams.logoUrl,
        },
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .leftJoin(teams, eq(posts.teamId, teams.id))
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(posts).where(where),
  ]);

  return NextResponse.json({
    posts: postList,
    total: totalResult[0]?.total ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { success } = await postRateLimit.limit(userId);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [post] = await db
    .insert(posts)
    .values({
      authorId: userId,
      title: parsed.data.title,
      content: parsed.data.content,
      teamId: parsed.data.teamId,
      gameId: parsed.data.gameId,
      type: parsed.data.type,
      locale: parsed.data.locale,
    })
    .returning();

  return NextResponse.json({ post }, { status: 201 });
}
