import { NextRequest, NextResponse } from "next/server";
import { globalEvalEngine } from "@/lib/developer/eval-engine";
import { DEFAULT_STRESS_TEST_CASES } from "@/lib/developer/stress-suite";
import { initializeDemoWorkspace } from "@/lib/store/demo-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      workspaceId = "demo-workspace",
      runName = `Regression Run #${Date.now().toString().slice(-4)}`,
      retrievalConfig = {
        chunkSize: 450,
        chunkOverlap: 50,
        topK: 5,
        similarityThreshold: 0.4,
      },
      modelName = "gemini-1.5-flash",
      testCases = DEFAULT_STRESS_TEST_CASES,
    } = body;

    await initializeDemoWorkspace(workspaceId);

    const run = await globalEvalEngine.executeExperimentRun(
      workspaceId,
      runName,
      testCases,
      retrievalConfig,
      modelName
    );

    return NextResponse.json({ success: true, run });
  } catch (error) {
    console.error("API /developer/regression/run error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
