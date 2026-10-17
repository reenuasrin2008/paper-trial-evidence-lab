import { NextRequest, NextResponse } from "next/server";
import { globalEvalEngine } from "@/lib/developer/eval-engine";
import { DEFAULT_STRESS_TEST_CASES } from "@/lib/developer/stress-suite";
import { initializeDemoWorkspace } from "@/lib/store/demo-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      workspaceId = "demo-workspace",
      modelName = "gemini-1.5-flash",
    } = body;

    await initializeDemoWorkspace(workspaceId);

    const run = await globalEvalEngine.executeExperimentRun(
      workspaceId,
      `Adversarial Stress Suite — ${new Date().toLocaleTimeString()}`,
      DEFAULT_STRESS_TEST_CASES,
      {
        chunkSize: 450,
        chunkOverlap: 50,
        topK: 5,
        similarityThreshold: 0.35,
      },
      modelName
    );

    return NextResponse.json({
      success: true,
      suiteName: "PaperTrail Adversarial & Edge-Case Benchmark v1",
      totalScenarios: DEFAULT_STRESS_TEST_CASES.length,
      run,
    });
  } catch (error) {
    console.error("API /developer/stress-test/run error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
