import { NextRequest, NextResponse } from "next/server";
import { globalStudentService } from "@/lib/student/study-service";
import { initializeDemoWorkspace } from "@/lib/store/demo-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId = "demo-workspace", topic = "Clinical protocol endpoints and RAG reliability" } = body;

    await initializeDemoWorkspace(workspaceId);
    const studyGuide = await globalStudentService.generateStudyGuide(workspaceId, topic);

    return NextResponse.json({ success: true, studyGuide });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
