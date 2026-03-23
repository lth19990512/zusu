export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { syncShots } from "@/services/ingestion/shots";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const dateStr = (body as { date?: string }).date;
    const date = dateStr ? new Date(dateStr) : new Date();

    const result = await syncShots(date);
    return NextResponse.json({
      success: true,
      date: date.toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("Shot sync failed:", error);
    return NextResponse.json(
      { error: "Shot sync failed", message: String(error) },
      { status: 500 }
    );
  }
}
