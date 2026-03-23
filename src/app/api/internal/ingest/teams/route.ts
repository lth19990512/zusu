import { NextResponse } from "next/server";
import { syncTeams } from "@/services/ingestion/teams";

export async function POST() {
  try {
    // TODO: Add QStash signature verification for production
    const result = await syncTeams();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Team sync failed:", error);
    return NextResponse.json(
      { error: "Team sync failed", message: String(error) },
      { status: 500 }
    );
  }
}
