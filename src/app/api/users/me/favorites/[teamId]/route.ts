export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { userFavoriteTeams } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;

  const result = await db
    .delete(userFavoriteTeams)
    .where(
      and(
        eq(userFavoriteTeams.userId, session.user.id),
        eq(userFavoriteTeams.teamId, teamId)
      )
    )
    .returning();

  if (result.length === 0) {
    return NextResponse.json(
      { error: "Favorite not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
