import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts, comments, users } from "@/db/schema";
import { eq, and, isNull, asc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { createCommentSchema } from "@/lib/validations/post";
import { commentRateLimit } from "@/lib/ratelimit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;

  // Get top-level comments
  const topLevelComments = await db
    .select({
      id: comments.id,
      content: comments.content,
      likeCount: comments.likeCount,
      isDeleted: comments.isDeleted,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      parentId: comments.parentId,
      author: {
        id: users.id,
        displayName: users.displayName,
        userNumber: users.userNumber,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(and(eq(comments.postId, postId), isNull(comments.parentId)))
    .orderBy(asc(comments.createdAt));

  // Get all replies for these comments
  const topLevelIds = topLevelComments.map((c) => c.id);

  let repliesMap: Record<string, typeof topLevelComments> = {};
  if (topLevelIds.length > 0) {
    const replies = await db
      .select({
        id: comments.id,
        content: comments.content,
        likeCount: comments.likeCount,
        isDeleted: comments.isDeleted,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        parentId: comments.parentId,
        author: {
          id: users.id,
          displayName: users.displayName,
          userNumber: users.userNumber,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(
        and(
          eq(comments.postId, postId),
          sql`${comments.parentId} IN (${sql.join(
            topLevelIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        )
      )
      .orderBy(asc(comments.createdAt));

    for (const reply of replies) {
      const pid = reply.parentId!;
      if (!repliesMap[pid]) repliesMap[pid] = [];
      repliesMap[pid].push(reply);
    }
  }

  // Build nested structure, replacing deleted content
  const result = topLevelComments.map((comment) => {
    const commentData = comment.isDeleted
      ? { ...comment, content: "[已刪除]", author: null }
      : comment;

    const commentReplies = (repliesMap[comment.id] || []).map((reply) =>
      reply.isDeleted
        ? { ...reply, content: "[已刪除]", author: null }
        : reply
    );

    return { ...commentData, replies: commentReplies };
  });

  return NextResponse.json({ comments: result });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: postId } = await params;

  const { success } = await commentRateLimit.limit(userId);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  // Check post exists and is not locked
  const [post] = await db
    .select({ id: posts.id, isLocked: posts.isLocked })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.isDeleted, false)))
    .limit(1);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.isLocked) {
    return NextResponse.json(
      { error: "This post is locked and cannot receive new comments." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // If parentId is provided, verify parent comment exists in the same post
  if (parsed.data.parentId) {
    const [parentComment] = await db
      .select({ id: comments.id })
      .from(comments)
      .where(
        and(
          eq(comments.id, parsed.data.parentId),
          eq(comments.postId, postId)
        )
      )
      .limit(1);

    if (!parentComment) {
      return NextResponse.json(
        { error: "Parent comment not found" },
        { status: 404 }
      );
    }
  }

  const [comment] = await db
    .insert(comments)
    .values({
      postId,
      authorId: userId,
      content: parsed.data.content,
      parentId: parsed.data.parentId,
    })
    .returning();

  // Increment post comment count
  await db
    .update(posts)
    .set({ commentCount: sql`${posts.commentCount} + 1` })
    .where(eq(posts.id, postId));

  return NextResponse.json({ comment }, { status: 201 });
}
