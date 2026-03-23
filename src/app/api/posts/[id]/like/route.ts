export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, likes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { likeRateLimit } from "@/lib/ratelimit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: postId } = await params;

  const { success } = await likeRateLimit.limit(userId);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  // Check post exists
  const [post] = await db
    .select({ id: posts.id, likeCount: posts.likeCount })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check if already liked
  const [existingLike] = await db
    .select({ id: likes.id })
    .from(likes)
    .where(
      and(
        eq(likes.userId, userId),
        eq(likes.targetType, "post"),
        eq(likes.targetId, postId)
      )
    )
    .limit(1);

  if (existingLike) {
    // Unlike
    await Promise.all([
      db.delete(likes).where(eq(likes.id, existingLike.id)),
      db
        .update(posts)
        .set({ likeCount: sql`${posts.likeCount} - 1` })
        .where(eq(posts.id, postId)),
    ]);

    return NextResponse.json({
      liked: false,
      likeCount: post.likeCount - 1,
    });
  } else {
    // Like
    await Promise.all([
      db.insert(likes).values({
        userId,
        targetType: "post",
        targetId: postId,
      }),
      db
        .update(posts)
        .set({ likeCount: sql`${posts.likeCount} + 1` })
        .where(eq(posts.id, postId)),
    ]);

    return NextResponse.json({
      liked: true,
      likeCount: post.likeCount + 1,
    });
  }
}
