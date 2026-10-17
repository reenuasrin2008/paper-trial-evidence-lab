import { NextRequest, NextResponse } from "next/server";
import { compareDocumentVersions } from "@/lib/analysis/version-diff";
import { initializeDemoWorkspace } from "@/lib/store/demo-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      docId = "doc-clinical-v1",
      versionA = 1,
      versionB = 2,
      workspaceId = "demo-workspace",
    } = body;

    await initializeDemoWorkspace(workspaceId);

    const diff = await compareDocumentVersions(docId, Number(versionA), Number(versionB), workspaceId);

    return NextResponse.json({ diff });
  } catch (error) {
    console.error("Version comparison API error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to compare document versions" },
      { status: 500 }
    );
  }
}
