import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { registerSchema } from "@/lib/validations/auth";
import { validateDisplayName } from "@/lib/profanity";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, displayName, locale } = parsed.data;

    // Profanity check on display name
    const nameCheck = validateDisplayName(displayName);
    if (!nameCheck.valid) {
      return NextResponse.json(
        { error: nameCheck.reason },
        { status: 400 }
      );
    }

    // Check if email already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    // Get next user number from sequence
    const result = await db.execute(
      sql`SELECT nextval('user_number_seq') as nextval`
    );
    const userNumber = parseInt(String((result.rows[0] as { nextval: string }).nextval), 10);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        displayName,
        userNumber,
        locale,
      })
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        userNumber: users.userNumber,
        locale: users.locale,
        role: users.role,
      });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
