export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { syncPlayers } from "@/services/ingestion/players";

export async function POST() {
  try {
    const result = await syncPlayers();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Player sync failed:", error);
    return NextResponse.json(
      { error: "Player sync failed", message: String(error) },
      { status: 500 }
    );
  }
}
