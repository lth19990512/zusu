import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { validateDisplayName } from "@/lib/profanity";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      userNumber: users.userNumber,
      avatarUrl: users.avatarUrl,
      locale: users.locale,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.displayName !== undefined) {
    const validation = validateDisplayName(body.displayName);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason },
        { status: 400 }
      );
    }
    updates.displayName = body.displayName;
  }

  if (body.locale !== undefined) {
    if (!["zh-TW", "en"].includes(body.locale)) {
      return NextResponse.json(
        { error: "Invalid locale. Must be zh-TW or en." },
        { status: 400 }
      );
    }
    updates.locale = body.locale;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  updates.updatedAt = new Date();

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, session.user.id))
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      userNumber: users.userNumber,
      avatarUrl: users.avatarUrl,
      locale: users.locale,
      role: users.role,
      createdAt: users.createdAt,
    });

  return NextResponse.json({ user: updated });
}
