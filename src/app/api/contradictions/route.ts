import { NextRequest, NextResponse } from "next/server";
import { globalContradictionService } from "@/lib/analysis/contradiction";
import { initializeDemoWorkspace } from "@/lib/store/demo-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId") || "demo-workspace";

  await initializeDemoWorkspace(workspaceId);
  const candidates = globalContradictionService.getCandidates(workspaceId);

  return NextResponse.json({ candidates });
}
