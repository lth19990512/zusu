export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, users, teams, likes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { updatePostSchema } from "@/lib/validations/post";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Increment view count and fetch post in parallel
  const [, postResult] = await Promise.all([
    db
      .update(posts)
      .set({ viewCount: sql`${posts.viewCount} + 1` })
      .where(eq(posts.id, id)),
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
        authorId: posts.authorId,
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
      .where(eq(posts.id, id))
      .limit(1),
  ]);

  const post = postResult[0];
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check if current user liked this post
  let isLikedByMe = false;
  const session = await auth();
  if (session?.user?.id) {
    const [existingLike] = await db
      .select({ id: likes.id })
      .from(likes)
      .where(
        and(
          eq(likes.userId, session.user.id),
          eq(likes.targetType, "post"),
          eq(likes.targetId, id)
        )
      )
      .limit(1);
    isLikedByMe = !!existingLike;
  }

  return NextResponse.json({ post: { ...post, isLikedByMe } });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const userRole = (session.user as { role?: string }).role;
  const { id } = await params;

  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.authorId !== userId && userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check 30-minute edit window (for non-admins)
  if (userRole !== "admin") {
    const thirtyMinutes = 30 * 60 * 1000;
    const elapsed = Date.now() - new Date(post.createdAt).getTime();
    if (elapsed > thirtyMinutes) {
      return NextResponse.json(
        { error: "Edit window expired. Posts can only be edited within 30 minutes." },
        { status: 403 }
      );
    }
  }

  const body = await request.json();
  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(posts)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id))
    .returning();

  return NextResponse.json({ post: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const userRole = (session.user as { role?: string }).role;
  const { id } = await params;

  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (
    post.authorId !== userId &&
    userRole !== "admin" &&
    userRole !== "mod"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [deleted] = await db
    .update(posts)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(posts.id, id))
    .returning();

  return NextResponse.json({ post: deleted });
}
