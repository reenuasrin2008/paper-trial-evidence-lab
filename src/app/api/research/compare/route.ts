import { NextRequest, NextResponse } from "next/server";
import { compareMultiplePapers } from "@/lib/research/comparison-service";
import { initializeDemoWorkspace } from "@/lib/store/demo-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paperIds, workspaceId = "demo-workspace" } = body;

    if (!paperIds || !Array.isArray(paperIds) || paperIds.length < 2) {
      return NextResponse.json(
        { error: "Provide at least 2 paper IDs to execute comparative analysis" },
        { status: 400 }
      );
    }

    await initializeDemoWorkspace(workspaceId);

    const report = await compareMultiplePapers(paperIds, workspaceId);

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Multi-paper comparison API error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to compare papers" },
      { status: 500 }
    );
  }
}
